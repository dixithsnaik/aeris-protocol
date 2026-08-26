from flask import Blueprint, g, request

from views.property import (
    approve_verify,
    complete_verify,
    create_listing,
    delete_owned,
    get_property,
    get_verify_catalog,
    list_mine,
    list_properties,
    list_watch,
    listing_desk,
    listing_thread,
    send_message,
    start_verify,
    suggest_places,
    update_owned,
    watch_add,
    watch_remove,
)

bp = Blueprint("properties", __name__)


@bp.get("/suggest")
def suggest_route():
    payload, status = suggest_places(request.args.get("q"))
    return payload, status


@bp.get("/mine")
def mine_route():
    payload, status = list_mine(g.user_id)
    return payload, status


@bp.get("/interested")
def interested_route():
    payload, status = list_watch(g.user_id)
    return payload, status


@bp.post("/interested")
def interested_add_route():
    body = request.get_json(silent=True) or {}
    payload, status = watch_add(g.user_id, body.get("property_id"))
    return payload, status


@bp.delete("/interested/<int:pid>")
def interested_remove_route(pid):
    payload, status = watch_remove(g.user_id, pid)
    return payload, status


@bp.post("")
@bp.post("/")
def create_route():
    if request.files:
        form = request.form
        files = request.files.getlist("images")
    else:
        form = request.get_json(silent=True) or {}
        files = []
    payload, status = create_listing(g.user_id, form, files)
    return payload, status


@bp.patch("/<int:pid>")
def update_route(pid):
    body = request.get_json(silent=True) or {}
    payload, status = update_owned(g.user_id, pid, body)
    return payload, status


@bp.delete("/<int:pid>")
def delete_route(pid):
    payload, status = delete_owned(g.user_id, pid)
    return payload, status


@bp.get("/<int:pid>/verify")
def verify_catalog_route(pid):
    payload, status = get_verify_catalog(g.user_id, pid)
    return payload, status


@bp.post("/<int:pid>/verify/checkout")
def verify_checkout_route(pid):
    body = request.get_json(silent=True) or {}
    payload, status = start_verify(g.user_id, pid, body.get("package_id"))
    return payload, status


@bp.post("/<int:pid>/verify")
def verify_route(pid):
    body = request.get_json(silent=True) or {}
    payload, status = complete_verify(g.user_id, pid, body)
    return payload, status


@bp.post("/<int:pid>/approve")
def approve_route(pid):
    payload, status = approve_verify(g.user_id, pid)
    return payload, status


@bp.get("/<int:pid>/desk")
def desk_route(pid):
    payload, status = listing_desk(g.user_id, pid)
    return payload, status


@bp.get("/<int:pid>/chats/<int:buyer_id>")
def thread_route(pid, buyer_id):
    payload, status = listing_thread(g.user_id, pid, buyer_id)
    return payload, status


@bp.post("/<int:pid>/chats")
def chat_send_route(pid):
    body = request.get_json(silent=True) or {}
    payload, status = send_message(g.user_id, pid, body.get("body"), body.get("buyer_id"))
    return payload, status


@bp.get("/<int:pid>")
def one_route(pid):
    payload, status = get_property(pid, getattr(g, "user_id", None))
    return payload, status


@bp.get("")
@bp.get("/")
def list_route():
    args = request.args
    payload, status = list_properties(
        args.get("q"),
        args.get("max_budget"),
        args.getlist("config"),
        args.get("verified"),
        args.get("offset"),
        args.get("limit"),
    )
    return payload, status
