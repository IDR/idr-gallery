
from django.http import HttpResponseRedirect, HttpResponseBadRequest, Http404, JsonResponse
from django.urls import reverse, NoReverseMatch
import json
import logging
import base64
import urllib
from collections import defaultdict

import omero
from omero.rtypes import wrap, rlong, rstring
from omeroweb.webclient.decorators import login_required, render_response
from omeroweb.api.decorators import login_required as api_login_required
from omeroweb.api.api_settings import API_MAX_LIMIT
from omeroweb.webclient.tree import marshal_annotations

import requests

from . import gallery_settings as settings
from .data.background_images import IDR_IMAGES, TISSUE_IMAGES, CELL_IMAGES
from .data.tabs import TABS
from .version import VERSION
from .utils import get_image_info, BIA_URL, parse_kvp_with_link, prefix_http, split_link

try:
    from omero_mapr import mapr_settings
except ImportError:
    mapr_settings = None

logger = logging.getLogger(__name__)
MAX_LIMIT = max(1, API_MAX_LIMIT)

EMBL_EBI_PUBLIC_GLOBUS_ID = "47772002-3e5b-4fd3-b97c-18cee38d6df2"
TABLE_NAMESPACE = "openmicroscopy.org/omero/bulk_annotations"


def redirect_with_params(viewname, **kwargs):
    """
    Redirect a view with params
    """
    rev = reverse(viewname)
    params = urllib.parse.urlencode(kwargs)
    if params:
        rev = '{}?{}'.format(rev, params)
    return HttpResponseRedirect(rev)


@login_required()
@render_response()
def index(request, super_category=None, conn=None, **kwargs):
    """
    Home page shows a list of groups OR a set of 'categories' from
    user-configured queries.
    """

    # template is different for '/search' page
    template = "idr_gallery/index.html"
    if "search" in request.path:
        template = "idr_gallery/search.html"
        query = request.GET.get("query")
        # Handle old URLs e.g. ?query=mapr_gene:PAX7
        if query:
            # if 'mapr' search, redirect to searchengine page
            if query.startswith("mapr_"):
                key_val = query.split(":", 1)
                if len(key_val) < 2:
                    keyval = None
                else:
                    mapr_key = key_val[0].replace("mapr_", "")
                    mapr_value = key_val[1]
                    keyval = find_mapr_key_value(request, mapr_key, mapr_value)
                if keyval is not None:
                    # /search/?key=Gene+Symbol&value=pax6&operator=contains
                    # Use "contains" to be consistent with studies search below
                    return redirect_with_params('idr_gallery_search',
                                                key=keyval[0],
                                                value=keyval[1],
                                                operator="contains")
            # handle e.g. ?query=Publication%20Authors:smith
            # ?key=Publication+Authors&value=Smith&operator=contains&resource=container
            keyval = query.split(":", 1)
            if len(keyval) > 1 and len(keyval[1]) > 0:
                # search for studies ("containers") and use "contains"
                # to match previous behaviour
                # NB: 'Name' needs to be 'name' for search-engine
                key = "name" if keyval[0] == "Name" else keyval[0]
                return redirect_with_params('idr_gallery_search',
                                            key=key,
                                            value=keyval[1],
                                            resource="container",
                                            operator="contains")
            return HttpResponseBadRequest(
                "Query should be ?query=key:value format")
    context = {'template': template}
    context["idr_images"] = IDR_IMAGES
    if super_category == "cell":
        context["idr_images"] = CELL_IMAGES
    elif super_category == "tissue":
        context["idr_images"] = TISSUE_IMAGES
    category = settings.SUPER_CATEGORIES.get(super_category)
    if category is not None:
        category['id'] = super_category
        context['super_category'] = json.dumps(category)
        context['category'] = super_category
    context["TABS"] = TABS
    context["VERSION"] = VERSION

    settings_ctx = get_settings_as_context()
    context = {**context, **settings_ctx}

    return context


def _escape_chars_like(query):
    escape_chars = {
        "%": r"\%",
        "_": r"\_",
    }

    for k, v in escape_chars.items():
        query = query.replace(k, v)
    return query


@login_required()
@render_response()
def study_page(request, idrid, format="html", conn=None, **kwargs):

    if len(idrid) != 7 or not idrid.startswith("idr") or not idrid[3:].isdigit():
        raise Http404("Invalid IDR ID. IDR IDs should be in the form idrXXXX")
    
    # find Project(s) or Screen(s) with this IDRID
    # query_service = conn.getQueryService()
    # params = omero.sys.ParametersI()
    # params.addString("idrid", rstring(_escape_chars_like("%s%%" % idrid)))
    # query = "select obj from Project as obj where obj.name like :idrid"
    # objs = query_service.findAllByQuery(query, params, conn.SERVICE_OPTS)

    # "like" search not working above. Just iterate and check names!
    objs = [p for p in conn.getObjects("Project") if p.name.startswith(idrid)]
    if len(objs) == 0:
        objs = [s for s in conn.getObjects("Screen") if s.name.startswith(idrid)]

    if len(objs) == 0:
        raise Http404("No Project or Screen found for %s" % idrid)
    
    # E.g."idr0098-huang-octmos", "idr0098-huang-octmos/experimentA", then "B"
    objs.sort(key=lambda x: (len(x.name), x.id))

    # Use first object for KVPs
    pids = None
    sids = None
    if objs[0].OMERO_CLASS == "Project":
        pids = [objs[0].id]
    else:
        sids = [objs[0].id]
    anns, experimenters = marshal_annotations(conn, project_ids=pids, screen_ids=sids,
                                              ann_type="map", ns="idr.openmicroscopy.org/study/info")
    kvps = defaultdict(list)
    for ann in anns:
        for kvp in ann["values"]:
            kvps[kvp[0]].append(kvp[1])

    # Choose Study Title first, then Publication Title
    title_values = kvps.get("Study Title", kvps.get("Publication Title"))
    containers = []
    for obj in objs:
        desc = obj.description
        for token in ["Screen", "Project", "Experiment", "Study"]:
            if f"{token} Description" in desc:
                desc = desc.split(f"{token} Description", 1)[1].strip()
        containers.append({
            "id": obj.id,
            "name": obj.name,
            "description": desc,
            "type": "Project" if obj.OMERO_CLASS == "Project" else "Screen",
            "kvps": kvps,
        })

    img_objects = []
    for obj in containers:
        img_objects.extend(_get_study_images(conn, obj["type"], obj["id"], tag_text="Study Example Image"))

    if len(img_objects) == 0:
        # None found with Tag - just load untagged image
        img_objects = _get_study_images(conn, obj["type"], obj["id"])
    images = [{"id": o.id.val, "name": o.name.val} for o in img_objects]

    # Use first image to get download & path info...
    img_info = get_image_info(conn, images[0]["id"])
    # data_location is "IDR" or "Github" or "BIA" or "Embassy_S3"
    img_path, data_location, is_zarr = img_info

    download_url = None
    bia_ngff_id = None
    idrid_name = containers[0]["name"].split("/")[0]
    if data_location == "IDR" or data_location == "Github":
        # then link to Download e.g. https://ftp.ebi.ac.uk/pub/databases/IDR/idr0002-heriche-condensation/
        # e.g. idr0002-heriche-condensation
        download_url = f"https://ftp.ebi.ac.uk/pub/databases/IDR/{idrid_name}"

    if data_location == "Embassy_S3":
        # "mkngff" data is at https://uk1s3.embassy.ebi.ac.uk/bia-integrator-data/pages/idr_ngff_data.html
        bia_ngff_id = img_path.split(BIA_URL, 1)[-1].split("/", 1)[0]

    KNOWN_KEYS = ["Publication Authors", "Study Title", "Publication Title", "Publication DOI", "Data DOI", "License", 
                  "PubMed ID", "PMC ID", "Release Date", "External URL", "Annotation File", "BioStudies Accession"]
    other_kvps = []
    for k, v in kvps.items():
        if k in KNOWN_KEYS:
            continue
        for value in v:
            other_kvps.append([k, value])

    # For json-LD, return JSON-LD context
    jsonld = marshal_jsonld(idrid, containers, kvps)
    if format == "jsonld":
        # Return JSON-LD format
        return JsonResponse(jsonld, content_type="application/ld+json")

    context = {
        "template": "idr_gallery/idr_study.html",
        "globus_origin_id": EMBL_EBI_PUBLIC_GLOBUS_ID,
        "idr_id": idrid,
        "idrid_name": idrid_name,
        "containers": containers,
        "images": images,
        "img_path": img_path,
        "data_location": data_location,
        "is_zarr": is_zarr,
        "title": title_values[0] if title_values else None,
        "download_url": download_url,
        "bia_ngff_id": bia_ngff_id,
        "authors": ",".join(kvps.get("Publication Authors", [])),
        "publication": parse_kvp_with_link("Publication DOI", kvps),
        "data_doi": parse_kvp_with_link("Data DOI", kvps),
        "license": parse_kvp_with_link("License", kvps),
        "pubmed_id": parse_kvp_with_link("PubMed ID", kvps),
        "pmc_id": parse_kvp_with_link("PMC ID", kvps),
        "release_date": kvps.get("Release Date")[0] if "Release Date" in kvps else None,
        "external_urls": [prefix_http(url) for url in kvps.get("External URL", [])],
        "annotation_files": [split_link(link) for link in kvps.get("Annotation File", [])],
        "bia_accession": parse_kvp_with_link("BioStudies Accession", kvps),
        "other_kvps": other_kvps,
        "jsonld": json.dumps(jsonld, indent=2),
    }

    settings_ctx = get_settings_as_context()
    context = {**context, **settings_ctx}
    return context


def marshal_jsonld(idrid, containers, kvps):
    license = parse_kvp_with_link("License", kvps)
    titles = kvps.get("Study Title", kvps.get("Publication Title"))
    jsonld = {
        "@context": "https://schema.org/",
        "@type": "Dataset",
        "name": ". ".join(titles) if titles else "IDR Study %s" % idrid,
        "description": containers[0]["description"],
        "url": "https://idr.openmicroscopy.org/study/%s/" % idrid,
        "license": license.get("link") if license else None,
    }
    return jsonld


def mapr(request, mapr_key):
    """
    Redirect to search page with mapr_key as query
    E.g. /mapr/gene/?value=PAX7 -> /search/?key=Gene+Symbol&value=PAX7
    """
    mapr_value = request.GET.get("value")
    if mapr_value is None:
        # e.g. /mapr/gene/ redirects to just /search/?key=Gene+Symbol
        if mapr_settings and mapr_key in mapr_settings.MAPR_CONFIG:
            # NB: this search for a single Key isn't exactly the same as
            # e.g. mapr/gene/ which searches for all 'gene' keys.
            default_key = mapr_settings.MAPR_CONFIG[mapr_key]["default"][0]
            return redirect_with_params('idr_gallery_search',
                                        key=default_key,
                                        operator="contains")
        raise Http404("Invalid mapr key")
    keyval = find_mapr_key_value(request, mapr_key, mapr_value, True)
    if keyval is None:
        raise Http404("No matching key found")
    return redirect_with_params('idr_gallery_search',
                                key=keyval[0],
                                value=keyval[1],
                                operator="equals")


def find_mapr_key_value(request, mapr_key, mapr_value, exact_match=False):
    if mapr_settings and mapr_key in mapr_settings.MAPR_CONFIG:
        # Key could be e.g. 'Gene Symbol' or 'Gene Identifier'
        mapr_config = mapr_settings.MAPR_CONFIG
        all_keys = mapr_config[mapr_key]["all"]
        default_key = mapr_config[mapr_key]["default"][0]
        # if multiple keys e.g. 'Gene Symbol' or 'Gene Identifier'
        if len(all_keys) > 1:
            # need to check which Key matches the Value...
            matching_keys = search_engine_keys(request, mapr_value,
                                               exact_match)
            all_keys = [key for key in all_keys if key in matching_keys]
        if len(all_keys) > 1 and default_key in all_keys:
            mapann_key = default_key
        elif len(all_keys) == 1:
            mapann_key = all_keys[0]
        else:
            # no matches -> use default
            mapann_key = default_key
        return mapann_key, mapr_value
    return None


def search_engine_keys(request, value, exact_match=False):
    # find keys that are match the given value
    if settings.BASE_URL is not None:
        base_url = settings.BASE_URL
    else:
        base_url = request.build_absolute_uri(reverse('index'))
    url = f"{base_url}searchengine/api/v1/resources/image/searchvalues/"
    url += f"?value={value}"
    json_data = requests.get(url).json().get("data", [])
    if exact_match:
        json_data = list(filter(
            lambda x: x.get("Value").lower() == value.lower(), json_data))
    keys = [result.get("Key") for result in json_data]
    return keys


def get_settings_as_context():
    context = {}
    category_queries = settings.CATEGORY_QUERIES
    context['favicon'] = settings.FAVICON
    context['gallery_title'] = settings.GALLERY_TITLE
    context['top_right_links'] = settings.TOP_RIGHT_LINKS
    context['top_left_logo'] = settings.TOP_LEFT_LOGO
    context['IDR_STUDIES_URL'] = settings.IDR_STUDIES_URL
    try:
        href = context['top_left_logo'].get('href', 'idr_gallery_index')
        context['top_left_logo']['href'] = reverse(href)
    except NoReverseMatch:
        pass
    # used by /search page
    context['SUPER_CATEGORIES'] = json.dumps(settings.SUPER_CATEGORIES)
    context['filter_keys'] = settings.FILTER_KEYS
    context['TITLE_KEYS'] = json.dumps(settings.TITLE_KEYS)
    context['STUDY_SHORT_NAME'] = json.dumps(settings.STUDY_SHORT_NAME)
    context['filter_mapr_keys'] = json.dumps(
        settings.FILTER_MAPR_KEYS)
    context['super_categories'] = settings.SUPER_CATEGORIES
    base_url = reverse('index')
    if settings.BASE_URL is not None:
        base_url = settings.BASE_URL
    context['base_url'] = base_url
    context['gallery_index'] = reverse('idr_gallery_index')
    if settings.GALLERY_INDEX is not None:
        context['gallery_index'] = settings.GALLERY_INDEX
    context['category_queries'] = json.dumps(category_queries)
    return context


@render_response()
def gallery_settings(request):
    """Return all settings as JSON."""

    attrs = ['CATEGORY_QUERIES',
             'GALLERY_TITLE',
             'FILTER_KEYS',
             'TITLE_KEYS',
             'FILTER_MAPR_KEYS',
             'SUPER_CATEGORIES',
             'BASE_URL',
             'TOP_RIGHT_LINKS',
             'TOP_LEFT_LOGO',
             'FAVICON',
             'STUDY_SHORT_NAME',
             ]

    context = {}
    for attr in attrs:
        try:
            context[attr] = getattr(settings, attr)
        except AttributeError:
            pass

    return context


def _get_study_images(conn, obj_type, obj_id, limit=1,
                      offset=0, tag_text=None):

    query_service = conn.getQueryService()
    params = omero.sys.ParametersI()
    params.addId(obj_id)
    params.theFilter = omero.sys.Filter()
    params.theFilter.limit = wrap(limit)
    params.theFilter.offset = wrap(offset)
    and_text_value = ""
    if tag_text is not None:
        params.addString("tag_text", tag_text)
        and_text_value = " and annotation.textValue = :tag_text"

    if obj_type.lower() == "project":
        query = "select i from Image as i"\
                " left outer join i.datasetLinks as dl"\
                " join dl.parent as dataset"\
                " left outer join dataset.projectLinks"\
                " as pl join pl.parent as project"\
                " left outer join i.annotationLinks as al"\
                " join al.child as annotation"\
                " where project.id = :id%s" % and_text_value

    elif obj_type.lower() == "screen":
        query = ("select i from Image as i"
                 " left outer join i.wellSamples as ws"
                 " join ws.well as well"
                 " join well.plate as pt"
                 " left outer join pt.screenLinks as sl"
                 " join sl.parent as screen"
                 " left outer join i.annotationLinks as al"
                 " join al.child as annotation"
                 " where screen.id = :id%s"
                 " order by well.column, well.row" % and_text_value)

    objs = query_service.findAllByQuery(query, params, conn.SERVICE_OPTS)

    return objs


@render_response()
@api_login_required()   # 403 JsonResponse if not logged in
def api_thumbnails(request, conn=None, **kwargs):
    """
    Return data like
    { project-1: {thumbnail: base64data, image: {id:1}} }
    """
    project_ids = request.GET.getlist('project')
    screen_ids = request.GET.getlist('screen')

    image_ids = {}
    for obj_type, ids in zip(['project', 'screen'], [project_ids, screen_ids]):
        for obj_id in ids:
            try:
                int(obj_id)
            except ValueError:
                logger.debug("api_thumbnails Invalid object ID %s" % obj_id)
                continue
            images = _get_study_images(conn, obj_type, obj_id,
                                       tag_text="Study Example Image")
            if len(images) == 0:
                # None found with Tag - just load untagged image
                images = _get_study_images(conn, obj_type, obj_id)
            if len(images) > 0:
                image_ids[images[0].id.val] = "%s-%s" % (obj_type, obj_id)

    thumbnails = conn.getThumbnailSet([rlong(i) for i in image_ids.keys()], 96)
    rv = {}
    for i, obj_id in image_ids.items():
        rv[obj_id] = {"image": {'id': i}}
        try:
            t = thumbnails[i]
            if len(t) > 0:
                # replace thumbnail urls by base64 encoded image
                rv[obj_id]["thumbnail"] = ("data:image/jpeg;base64,%s" %
                                           base64.b64encode(t).decode("utf-8"))

        except KeyError:
            logger.error("Thumbnail not available. (img id: %d)" % i)
    return rv
