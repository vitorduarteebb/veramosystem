from django.urls import path, include
from django.views.generic import TemplateView
from . import views
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    CompanyViewSet,
    UnionViewSet,
    ScheduleViewSet,
    DemissaoProcessViewSet,
    DocumentViewSet,
    CompanyUnionViewSet,
    DashboardView,
    ScheduleConfigViewSet,
    AgendaBlockViewSet,
    CustomLoginView,
    dashboard_view,
    SystemLogViewSet,
    GoogleOAuthCallbackView,
    DiagnosticoRedirectUriView,
    TestRealGoogleMeetView,
)
from .views_secure_media import secure_document, secure_assinatura, secure_media_info
from .views_cleanup import limpar_homologacoes
from . import health

app_name = 'core'

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'unions', UnionViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'demissao-processes', DemissaoProcessViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'company-unions', CompanyUnionViewSet)
router.register(r'schedule-configs', ScheduleConfigViewSet)
router.register(r'agenda-blocks', AgendaBlockViewSet)
router.register(r'logs', SystemLogViewSet)

urlpatterns = [
    # API router
    path('', include(router.urls)),

    # Dashboard e login
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('login/', CustomLoginView.as_view(), name='custom-login'),
    path('dashboard-view/', dashboard_view, name='dashboard-view'),
    
    # OAuth Callback - ROTA EXATA DO REDIRECT
    path('oauth2callback', GoogleOAuthCallbackView.as_view(), name='google_oauth_callback'),
    
    # Diagnóstico cirúrgico
    path('diagnostico-redirect-uri/', DiagnosticoRedirectUriView.as_view(), name='diagnostico-redirect-uri'),
    
    # Teste Google Meet REAL
    path('test-real-google-meet/', TestRealGoogleMeetView.as_view(), name='test-real-google-meet'),

    # Health endpoints
    path('health/live', health.live, name='health_live'),
    path('health/ready', health.ready, name='health_ready'),
    path('health/detailed', health.detailed, name='health_detailed'),

    # Mídia segura
    path('secure-media/document/<int:pk>/', secure_document, name='secure-document'),
    path('secure-media/assinatura/<int:pk>/<str:tipo>/', secure_assinatura, name='secure-assinatura'),
    path('secure-media/info/<int:pk>/', secure_media_info, name='secure-media-info'),
    # Upload público do trabalhador
    path('public/upload/<int:pk>/<str:token>/', views.PublicUploadView.as_view(), name='public-upload'),
    
    # Limpeza de dados
    path('cleanup/homologacoes/', limpar_homologacoes, name='limpar-homologacoes'),
] 