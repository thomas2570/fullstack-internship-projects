"""
Root URL Configuration for Multi-Tenant SaaS Project Management Platform.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Application APIs
    path('api/auth/', include('authentication.urls', namespace='auth')),
    path('api/workspaces/', include('workspaces.urls', namespace='workspaces')),
    path('api/projects/', include('projects.urls', namespace='projects')),
    path('api/boards/', include('boards.urls', namespace='boards')),
    path('api/sprints/', include('sprints.urls', namespace='sprints')),
    path('api/issues/', include('issues.urls', namespace='issues')),
    path('api/audit/', include('audit.urls', namespace='audit')),
    path('api/webhooks/', include('webhooks.urls', namespace='webhooks')),
    path('api/billing/', include('billing.urls', namespace='billing')),
    path('api/notifications/', include('notifications.urls', namespace='notifications')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
