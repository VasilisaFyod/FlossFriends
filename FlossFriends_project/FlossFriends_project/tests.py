import json
import os
from unittest.mock import Mock, patch

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "FlossFriends_django.settings_test")
django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Canvas, Favorite, Like, Palette, Pattern, Thread, ThreadInventory


User = get_user_model()


class BaseAppTestCase(TestCase):
    def setUp(self):
        self.password = "Password123"
        self.user = User.objects.create_user(
            username="user",
            email="user@test.com",
            password=self.password,
            email_verified=True,
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@test.com",
            password=self.password,
            email_verified=True,
        )
        self.canvas = Canvas.objects.create(name="Aida 14", count_per_cm=5.50)
        self.palette = Palette.objects.create(name="DMC")
        self.thread = Thread.objects.create(
            thread_id=1,
            palette=self.palette,
            code="1",
            name="White Tin",
            rgb_r=255,
            rgb_g=255,
            rgb_b=255,
            hex_value="#FFFFFF",
        )
        self.pattern = Pattern.objects.create(
            user=self.user,
            canvas=self.canvas,
            title="Pattern",
            image_original="",
            image_preview="",
            pattern_data=json.dumps({"cells": [], "legend": [], "palette": "DMC"}),
            size_width=10,
            size_height=10,
            created_at=timezone.now(),
        )

    def login(self, user=None):
        current_user = user or self.user
        self.client.force_login(current_user)


class RegistrationTests(TestCase):
    @patch("FlossFriends_project.services.auth_service.threading.Thread")
    def test_register_success_creates_user(self, thread_cls):
        thread_cls.return_value = Mock(start=Mock())

        response = self.client.post(
            reverse("register"),
            {
                "username": "new_user",
                "email": "new_user@test.com",
                "password": "StrongPass123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(username="new_user", email="new_user@test.com").exists())

    def test_register_duplicate_email_shows_error(self):
        User.objects.create_user(
            username="existing",
            email="existing@test.com",
            password="StrongPass123",
        )

        response = self.client.post(
            reverse("register"),
            {
                "username": "another_user",
                "email": "existing@test.com",
                "password": "StrongPass123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.filter(email="existing@test.com").count(), 1)
        self.assertTrue(response.context["error"])

    def test_register_duplicate_username_shows_error(self):
        User.objects.create_user(
            username="existing_user",
            email="first@test.com",
            password="StrongPass123",
        )

        response = self.client.post(
            reverse("register"),
            {
                "username": "existing_user",
                "email": "second@test.com",
                "password": "StrongPass123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="second@test.com").exists())
        self.assertTrue(response.context["error"])

    def test_register_invalid_data_shows_validation_error(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "",
                "email": "invalid",
                "password": "77",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.count(), 0)
        self.assertTrue(response.context["error"])


class LoginAndGenerationTests(BaseAppTestCase):
    def test_login_wrong_password_shows_error(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": self.user.username,
                "password": "WrongPassword123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context["error"])

    @patch("FlossFriends_project.views.api.media._generate_pollinations_image")
    def test_generated_image_is_saved_for_pattern_creation(self, mock_generate):
        self.login()
        mock_generate.return_value = {
            "bytes": b"fake-image-bytes",
            "content_type": "image/png",
            "translated_prompt": "cat with yarn",
            "model": "flux",
        }

        response = self.client.post(
            reverse("generate_ai_image"),
            data=json.dumps({"prompt": "котенок"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("temp_image", self.client.session)

        next_response = self.client.get(reverse("create_pattern_steps"))
        self.assertEqual(next_response.status_code, 200)
        self.assertIn("temp_image", next_response.context)

    def test_generate_image_empty_prompt_returns_error(self):
        self.login()

        response = self.client.post(
            reverse("generate_ai_image"),
            data=json.dumps({"prompt": ""}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertNotIn("temp_image", self.client.session)


class PatternTests(BaseAppTestCase):
    def test_save_pattern_creates_pattern(self):
        self.login()
        payload = {
            "canvas": self.canvas.name,
            "title": "Saved Pattern",
            "image": "",
            "cells": [[{"code": "1", "r": 255, "g": 255, "b": 255}]],
            "legend": [{"code": "1", "length_cm": 10}],
            "palette": "DMC",
            "width": 1,
            "height": 1,
        }

        response = self.client.post(
            reverse("save_pattern_api"),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Pattern.objects.filter(user=self.user, title="Saved Pattern").exists())

    def test_delete_pattern_removes_pattern(self):
        self.login()
        pattern_id = self.pattern.pattern_id

        response = self.client.post(reverse("delete_pattern", args=[pattern_id]))

        self.assertEqual(response.status_code, 302)
        self.assertFalse(Pattern.objects.filter(pattern_id=pattern_id).exists())


class InventoryTests(BaseAppTestCase):
    def test_add_thread_with_valid_code_creates_inventory_item(self):
        self.login()

        response = self.client.post(reverse("add_thread"), {"code": "1"})

        self.assertEqual(response.status_code, 302)
        self.assertTrue(ThreadInventory.objects.filter(user=self.user, thread=self.thread).exists())

    def test_add_thread_with_invalid_code_does_not_create_item(self):
        self.login()

        response = self.client.post(reverse("add_thread"), {"code": "missing"})

        self.assertEqual(response.status_code, 302)
        self.assertFalse(ThreadInventory.objects.filter(user=self.user).exists())

    def test_add_thread_duplicate_does_not_create_second_item(self):
        self.login()
        ThreadInventory.objects.create(user=self.user, thread=self.thread, length_cm=800)

        response = self.client.post(reverse("add_thread"), {"code": "1"})

        self.assertEqual(response.status_code, 302)
        self.assertEqual(ThreadInventory.objects.filter(user=self.user, thread=self.thread).count(), 1)

    def test_update_thread_quantity_changes_length(self):
        self.login()
        inventory_item = ThreadInventory.objects.create(user=self.user, thread=self.thread, length_cm=800)

        response = self.client.post(
            reverse("update_thread_quantity", args=[inventory_item.thread_id]),
            {"quantity_cm": "1200"},
        )

        self.assertEqual(response.status_code, 200)
        inventory_item.refresh_from_db()
        self.assertEqual(inventory_item.length_cm, 1200)

    def test_delete_thread_removes_inventory_item(self):
        self.login()
        ThreadInventory.objects.create(user=self.user, thread=self.thread, length_cm=800)

        response = self.client.post(reverse("delete_thread", args=[self.thread.thread_id]))

        self.assertEqual(response.status_code, 302)
        self.assertFalse(ThreadInventory.objects.filter(user=self.user, thread=self.thread).exists())


class ProfileTests(BaseAppTestCase):
    def test_edit_profile_updates_user_data(self):
        self.login()

        response = self.client.post(
            reverse("my_profile"),
            {
                "username": "updated_user",
                "email": "updated@test.com",
                "password": "",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "updated_user")
        self.assertEqual(self.user.email, "updated@test.com")

    def test_edit_profile_invalid_data_shows_error(self):
        self.login()

        response = self.client.post(
            reverse("my_profile"),
            {
                "username": "",
                "email": self.user.email,
                "password": "",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context["error"])

    def test_deleted_account_cannot_log_in(self):
        self.login()
        username = self.user.username

        delete_response = self.client.post(reverse("delete_profile"))

        self.assertEqual(delete_response.status_code, 302)
        self.assertFalse(User.objects.filter(username=username).exists())

        login_response = self.client.post(
            reverse("login"),
            {"username": username, "password": self.password},
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertTrue(login_response.context["error"])


class SocialTests(BaseAppTestCase):
    def test_toggle_favorite_adds_favorite(self):
        self.login(self.other_user)

        response = self.client.post(reverse("toggle_favorite", args=[self.pattern.pattern_id]))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Favorite.objects.filter(user=self.other_user, pattern=self.pattern).exists())

    def test_toggle_like_adds_like(self):
        self.login(self.other_user)

        response = self.client.post(reverse("toggle_like", args=[self.pattern.pattern_id]))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Like.objects.filter(user=self.other_user, pattern=self.pattern).exists())
