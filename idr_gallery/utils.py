
import omero


def get_import_from_path(conn, imageId):
    query = "select fse from Fileset f \
        join f.usedFiles as fse \
        join f.images as imgs \
        where :id in imgs"
    params = omero.sys.ParametersI()
    params.addId(imageId)
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
            path.startswith("idr/incoming"):
            kind = "IDR"
        elif path.startswith("uod/idr/metadata"):
            kind = "Github"
        elif path.startswith("bia"):
            kind = "BIA"
        elif path.startswith("https://uk1s3.embassy.ebi.ac.uk/bia-integrator-data"):
            kind = "Embassy_S3"
        zarr = "No"
        if ".zarr" in path:
            zarr = "Yes"
        return (path, kind, zarr)
    return (None, None, None)
