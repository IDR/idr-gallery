from django.urls import re_path, path
from .gallery_settings import SUPER_CATEGORIES

from . import views

urlpatterns = [
    # index 'home page' of the idr_gallery app
    re_path(r'^$', views.index, name='idr_gallery_index'),

    path("study/<slug:idrid>/", views.study_page, name='idr_gallery_study'),
    path("study/<slug:idrid>/json/", views.study_page, {"format": "jsonld"},
         name='idr_gallery_study_jsonld'),

    # All settings as JSON
    re_path(r'^gallery_settings/$', views.gallery_settings),

    # Search page shows Projects / Screens filtered by Map Annotation
    re_path(r'^search/$', views.index, {'super_category': None},
            name="idr_gallery_search"),

    # Supports e.g. ?project=1&project=2&screen=3
    re_path(r'^gallery-api/thumbnails/$', views.api_thumbnails,
            name='idr_gallery_api_thumbnails'),

    # handle mapr URLs and redirect to search e.g. /mapr/gene/?value=PAX7
    # First URL is matched by mapr itself, so not used while mapr istalled...
    # we want a regex that matches mapr_key but not favicon
    re_path(r'^mapr/(?P<mapr_key>(?!favicon)[\w]+)/$',
            views.mapr, name='mapr'),
]

for c in SUPER_CATEGORIES:
    urlpatterns.append(re_path(r'^%s/$' % c, views.index,
                               {'super_category': c},
                               name="gallery_super_category"))
    urlpatterns.append(re_path(r'^%s/search/$' % c, views.index,
                               {'super_category': c}))
