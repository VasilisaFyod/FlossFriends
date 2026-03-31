from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from FlossFriends_project.views import auth_views, page_views, api_views

urlpatterns = [
    # 🔹 Админка
    path('admin/', admin.site.urls),

    # 🔹 Страницы
    path('', page_views.first_page, name='first_page'),
    path('base/', page_views.base, name='base'),
    path('my_profile/', page_views.my_profile, name='my_profile'),
    path('my_patterns/', page_views.my_patterns, name='my_patterns'),
    path('favorites/', page_views.favorites, name='favorites'),
    path('community/', page_views.community, name='community'),
    path('publish_pattern/', page_views.publish_pattern, name='publish_pattern'),
    path('pattern_view/', page_views.pattern_view, name='pattern_view'),
    path('delete-profile/', page_views.delete_profile_view, name='delete_profile'),
    path('inventory/', page_views.inventory, name='inventory'),
    path('inventory/add/', page_views.add_thread, name='add_thread'),
    path('delete/<int:thread_id>/', page_views.delete_thread, name='delete_thread'),
    path('get_thread_color/', page_views.get_thread_color, name='get_thread_color'),
    path('patterns/edit/<int:pattern_id>/', page_views.edit_pattern, name='edit_pattern'),
    path('patterns/delete/<int:pattern_id>/', page_views.delete_pattern, name='delete_pattern'),
    # 🔹 AUTH
    path('register/', auth_views.register_view, name='register'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('verify-email/<uuid:token>/', auth_views.verify_email, name='verify_email'),

    # 🔹 Protected
    path('add_image_for_create/', page_views.add_image_for_create, name='add_image_for_create'),
    path('create_pattern_steps/', page_views.create_pattern_steps, name='create_pattern_steps'),

    # 🔹 API
    path('api/generate-pattern/', api_views.generate_pattern_api, name='generate_pattern_api'),
    path('api/get-palette-max/', api_views.get_palette_max_colors, name='get_palette_max_colors'),
    path('api/get-canvas/', api_views.get_canvas_list, name='get_canvas_list'),
    path('api/save-pattern/', api_views.save_pattern_api, name='save_pattern_api'),
    path('api/pattern/<int:pattern_id>/', api_views.get_pattern_api, name='get_pattern_api'),
    path('api/pattern/<int:pattern_id>/update/', api_views.update_pattern_api, name='update_pattern_api'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
