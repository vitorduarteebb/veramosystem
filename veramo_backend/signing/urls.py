from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SigningSessionViewSet

router = DefaultRouter()
router.register(r'sessions', SigningSessionViewSet, basename='signing-session')

urlpatterns = [
    path('', include(router.urls)),
]
