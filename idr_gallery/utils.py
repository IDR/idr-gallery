
import omero


BIA_URL = "https://uk1s3.embassy.ebi.ac.uk/bia-integrator-data/"


def get_import_from_path(conn, imageid):
    query = "select fse from Fileset f \
        join f.usedFiles as fse \
        join f.images as imgs \
        where :id in imgs"
    params = omero.sys.ParametersI()
    params.addId(imageid)
    res = conn.getQueryService().findAllByQuery(query, params)
    if res and len(res) > 0:
        return res[0].clientPath._val
    return None


def get_image_info(conn, image_id):
    path = get_import_from_path(conn, image_id)
    if path:
        kind = "NA"
        if path.startswith("uod/idr/filesets") or \
                path.startswith("nfs/bioimage") or \
                path.startswith("idr/filesets") or \
                path.startswith("idr/tmp") or \
                path.startswith("uod/idr/incoming"):
            kind = "IDR"
        elif path.startswith("uod/idr/metadata") or \
                path.startswith("data/idr-metadata"):
            kind = "Github"
        elif path.startswith("bia"):
            kind = "BIA"
        elif path.startswith(BIA_URL):
            kind = "Embassy_S3"
        zarr = ".zarr" in path
        return (path, kind, zarr)
    return (None, None, None)


# E.g. Publication DOI:
# "10.1091/mbc.E13-04-0221 https://doi.org/10.1091/mbc.E13-04-0221"
# or License: "CC-BY-4.0 http://creativecommons.org/licenses/by/4.0/"
def parse_kvp_with_link(key, kvps):
    # values is a list to handle multiple values
    value = kvps.get(key)[0] if kvps.get(key) else None
    if value is None:
        return None
    return split_link(value)


def split_link(value):
    return {
        "name": value.split("http", 1)[0].strip(),
        "link": "http" + value.split("http", 1)[1] if "http" in value else None
    }


def prefix_http(url):
    """Ensure the URL starts with http:// or https://."""
    if not url.startswith(("http://", "https://")):
        return "https://" + url
    return url
