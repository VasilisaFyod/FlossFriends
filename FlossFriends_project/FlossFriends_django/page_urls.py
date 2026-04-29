from django.urls import path

from FlossFriends_project.views import page_views
from FlossFriends_project.views.api import inventory as inventory_api, media as media_api


urlpatterns = [
    path("", page_views.first_page, name="first_page"),
    path("base/", page_views.base, name="base"),
    path("my_profile/", page_views.my_profile, name="my_profile"),
    path("my_patterns/", page_views.my_patterns, name="my_patterns"),
    path("favorites/", page_views.favorites, name="favorites"),
    path("community/", page_views.community, name="community"),
    path("publish_pattern/", page_views.publish_pattern, name="publish_pattern"),
    path("pattern_view/", page_views.pattern_view, name="pattern_view"),
    path("delete-profile/", page_views.delete_profile_view, name="delete_profile"),
    path("inventory/", page_views.inventory, name="inventory"),
    path("inventory/add/", page_views.add_thread, name="add_thread"),
    path("delete/<int:thread_id>/", page_views.delete_thread, name="delete_thread"),
    path("update_quantity/<int:thread_id>/", inventory_api.update_thread_quantity, name="update_thread_quantity"),
    path("get_thread_color/", inventory_api.get_thread_color, name="get_thread_color"),
    path("api/inventory-threads/", inventory_api.get_inventory_threads, name="get_inventory_threads"),
    path("patterns/edit/<int:pattern_id>/", page_views.edit_pattern, name="edit_pattern"),
    path("patterns/delete/<int:pattern_id>/", page_views.delete_pattern, name="delete_pattern"),
    path("patterns/publish/", page_views.publish_pattern_from_my_patterns, name="publish_pattern_from_my_patterns"),
    path("patterns/unpublish/<int:pattern_id>/", page_views.unpublish_pattern, name="unpublish_pattern"),
    path("add_image_for_create/", page_views.add_image_for_create, name="add_image_for_create"),
    path("create_pattern_steps/", page_views.create_pattern_steps, name="create_pattern_steps"),
    path("clear-temp-image/", media_api.clear_temp_image, name="clear_temp_image"),
]
