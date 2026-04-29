from django.urls import path

from FlossFriends_project.views.api import media as media_api, patterns as patterns_api, social as social_api


urlpatterns = [
    path("api/generate-pattern/", patterns_api.generate_pattern_api, name="generate_pattern_api"),
    path("api/get-palette-max/", patterns_api.get_palette_max_colors, name="get_palette_max_colors"),
    path("api/get-canvas/", patterns_api.get_canvas_list, name="get_canvas_list"),
    path("api/save-pattern/", patterns_api.save_pattern_api, name="save_pattern_api"),
    path("api/pattern/<int:pattern_id>/", patterns_api.get_pattern_api, name="get_pattern_api"),
    path("api/pattern/<int:pattern_id>/update/", patterns_api.update_pattern_api, name="update_pattern_api"),
    path("api/generate-ai-image/", media_api.generate_ai_image, name="generate_ai_image"),
    path("api/toggle-favorite/<int:pattern_id>/", social_api.toggle_favorite, name="toggle_favorite"),
    path("api/toggle-like/<int:pattern_id>/", social_api.toggle_like, name="toggle_like"),
]
