from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GeofenceViewSet

router = DefaultRouter()
router.register("", GeofenceViewSet, basename="geofence")

urlpatterns = [
    path("", include(router.urls)),
]
