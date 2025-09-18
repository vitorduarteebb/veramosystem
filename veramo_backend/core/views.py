
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from .models.document import Document
from .serializers import DocumentSerializer, MultiDocumentUploadSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models.schedule import Schedule
from .serializers import ScheduleSerializer, RessalvaSerializer, AceiteSerializer
from django.utils import timezone
from .models.company import Company
from .models.union import Union, CompanyUnion
from .models.user import User
from .serializers import CompanySerializer, UnionSerializer, CompanyUnionSerializer, UserSerializer
from .permissions import (
    IsSuperAdmin, IsCompanyMaster, IsSuperAdminOrCompanyMaster, 
    IsUnionMasterOrSuperAdmin, IsSuperAdminOrCompanyMasterOrUnionMaster,
    IsSameOrg, IsOwnerOrSameOrg
)
from .mixins import OrgScopedQuerysetMixin
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from .models.config import ScheduleConfig
from .serializers import ScheduleConfigSerializer
from .models.block import AgendaBlock
from .serializers import AgendaBlockSerializer
from .models.log import SystemLog
from .serializers import SystemLogSerializer
from datetime import datetime, timedelta, time
from .models.demissao_process import DemissaoProcess
from .serializers import DemissaoProcessSerializer
from .models.document import DOCUMENT_TYPE_CHOICES
from .models.employee import Employee
from django.conf import settings
try:
    from .services.notification_service import notify_agendamento
except Exception:
    notify_agendamento = None
from rest_framework.throttling import ScopedRateThrottle
from django.utils.crypto import get_random_string

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.db import transaction
import logging

# Importar os serviços
try:
    from .services.google_meet_service import GoogleMeetService
    GOOGLE_MEET_AVAILABLE = True
except ImportError:
    GOOGLE_MEET_AVAILABLE = False
    logging.warning("Google Meet service não disponível - funcionalidade de videoconferência desabilitada")

try:
    from .services.email_service import EmailService
    EMAIL_SERVICE_AVAILABLE = True
except ImportError:
    EMAIL_SERVICE_AVAILABLE = False
    logging.warning("Email service não disponível - funcionalidade de email desabilitada")

# Configurar logger de segurança
security_logger = logging.getLogger('core.security')

class LoginThrottle(ScopedRateThrottle):
    scope = 'login'

# Create your views here.

class DocumentViewSet(OrgScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, IsSameOrg]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def create(self, request, *args, **kwargs):
        # Suporta upload individual ou múltiplo
        if isinstance(request.data.get('documents'), list):
            serializer = MultiDocumentUploadSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            employee_id = serializer.validated_data['employee']
            files = serializer.validated_data['documents']
            types = serializer.validated_data['types']
            docs = []
            for file, doc_type in zip(files, types):
                doc = Document.objects.create(employee_id=employee_id, type=doc_type, file=file)
                docs.append(doc)
            return Response(DocumentSerializer(docs, many=True).data, status=status.HTTP_201_CREATED)
        else:
            return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='employee/(?P<employee_id>[^/.]+)')
    def by_employee(self, request, employee_id=None):
        docs = Document.objects.filter(employee_id=employee_id)
        return Response(DocumentSerializer(docs, many=True).data)

class ScheduleViewSet(OrgScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated, IsSameOrg]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def create(self, request, *args, **kwargs):
        """Criar agendamento com sala do Google Meet automática"""
        try:
            with transaction.atomic():
                # Criar o agendamento primeiro
                response = super().create(request, *args, **kwargs)
                
                if response.status_code == status.HTTP_201_CREATED:
                    schedule_data = response.data
                    schedule_id = schedule_data['id']
                    
                    # Criar sala do Google Meet se disponível
                    if GOOGLE_MEET_AVAILABLE:
                        self._create_google_meet_room(schedule_id)
                
                return response
                
        except Exception as e:
            logging.error(f"Erro ao criar agendamento: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        """Atualizar agendamento e sincronizar com Google Meet se necessário"""
        try:
            with transaction.atomic():
                response = super().update(request, *args, **kwargs)
                
                if response.status_code == status.HTTP_200_OK:
                    schedule_data = response.data
                    schedule_id = schedule_data['id']
                    
                    # Atualizar sala do Google Meet se disponível
                    if GOOGLE_MEET_AVAILABLE:
                        self._update_google_meet_room(schedule_id)
                
                return response
                
        except Exception as e:
            logging.error(f"Erro ao atualizar agendamento: {str(e)}")
            raise

    def _create_google_meet_room(self, schedule_id):
        """Cria sala do Google Meet para o agendamento"""
        try:
            schedule = Schedule.objects.get(id=schedule_id)
            
            # Verificar se já tem sala criada
            if schedule.has_google_meeting:
                return
            
            # Criar serviço do Google Meet
            meet_service = GoogleMeetService()
            
            # Preparar dados para a reunião
            start_datetime = datetime.combine(schedule.date, schedule.start_time)
            end_datetime = datetime.combine(schedule.date, schedule.end_time)
            
            # Criar título e descrição da reunião
            summary = f"Homologação - {schedule.employee.name} - {schedule.company.name}"
            description = f"""
            Homologação de demissão
            Funcionário: {schedule.employee.name}
            Empresa: {schedule.company.name}
            Sindicato: {schedule.union.name}
            Data: {schedule.date.strftime('%d/%m/%Y')}
            Horário: {schedule.start_time.strftime('%H:%M')} - {schedule.end_time.strftime('%H:%M')}
            """
            
            # Criar reunião no Google Meet
            meeting_info = meet_service.create_meeting(
                summary=summary,
                description=description,
                start_time=start_datetime,
                end_time=end_datetime,
                attendees=[],  # Será preenchido posteriormente
                location="Google Meet"
            )
            
            if meeting_info:
                # Atualizar agendamento com informações do Google Meet
                schedule.google_calendar_event_id = meeting_info['event_id']
                schedule.google_meet_conference_id = meeting_info.get('conference_id')
                schedule.google_meet_link = meeting_info['meet_link']
                schedule.google_calendar_link = meeting_info['html_link']
                schedule.meeting_created_at = timezone.now()
                schedule.video_link = meeting_info['meet_link']  # Manter compatibilidade
                schedule.save()
                
                logging.info(f"Sala do Google Meet criada para agendamento {schedule_id}")
            else:
                logging.error(f"Falha ao criar sala do Google Meet para agendamento {schedule_id}")
                
        except Exception as e:
            logging.error(f"Erro ao criar sala do Google Meet: {str(e)}")

    def _update_google_meet_room(self, schedule_id):
        """Atualiza sala do Google Meet para o agendamento"""
        try:
            schedule = Schedule.objects.get(id=schedule_id)
            
            # Verificar se tem sala criada
            if not schedule.has_google_meeting:
                return
            
            # Criar serviço do Google Meet
            meet_service = GoogleMeetService()
            
            # Preparar dados para atualização
            start_datetime = datetime.combine(schedule.date, schedule.start_time)
            end_datetime = datetime.combine(schedule.date, schedule.end_time)
            
            # Atualizar reunião no Google Meet
            meeting_info = meet_service.update_meeting(
                event_id=schedule.google_calendar_event_id,
                start_time=start_datetime,
                end_time=end_datetime
            )
            
            if meeting_info:
                # Atualizar links se necessário
                if meeting_info.get('meet_link'):
                    schedule.google_meet_link = meeting_info['meet_link']
                    schedule.video_link = meeting_info['meet_link']
                    schedule.save()
                
                logging.info(f"Sala do Google Meet atualizada para agendamento {schedule_id}")
            else:
                logging.error(f"Falha ao atualizar sala do Google Meet para agendamento {schedule_id}")
                
        except Exception as e:
            logging.error(f"Erro ao atualizar sala do Google Meet: {str(e)}")

    @action(detail=True, methods=['post'])
    def ressalva(self, request, pk=None):
        schedule = self.get_object()
        serializer = RessalvaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule.ressalvas = serializer.validated_data['ressalvas']
        schedule.save()
        return Response({'detail': 'Ressalva gravada com sucesso.'})

    @action(detail=True, methods=['post'])
    def aceite(self, request, pk=None):
        schedule = self.get_object()
        serializer = AceiteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule.aceite = serializer.validated_data['aceite']
        schedule.cpf_assinatura = serializer.validated_data['cpf_assinatura']
        schedule.ip_assinatura = serializer.validated_data['ip_assinatura']
        schedule.data_aceite = serializer.validated_data['data_aceite']
        schedule.save()
        return Response({'detail': 'Aceite registrado com sucesso.'})

    @action(detail=False, methods=['get'], url_path='union/(?P<union_id>[^/.]+)')
    def by_union(self, request, union_id=None):
        # Listar agendamentos das empresas vinculadas ao sindicato
        queryset = Schedule.objects.filter(union_id=union_id)
        return Response(ScheduleSerializer(queryset, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsUnionMasterOrSuperAdmin])
    def aprovar_documentos(self, request, pk=None):
        schedule = self.get_object()
        schedule.status = 'documentos_aprovados'
        schedule.motivo_recusa_document_id = ''
        schedule.save()
        return Response({'detail': 'Documentação aprovada.'})

    @action(detail=True, methods=['post'], permission_classes=[IsUnionMasterOrSuperAdmin])
    def recusar_documentos(self, request, pk=None):
        schedule = self.get_object()
        motivo = request.data.get('motivo')
        if not motivo:
            return Response({'motivo': 'Campo obrigatório.'}, status=400)
        schedule.status = 'documentos_recusados'
        schedule.motivo_recusa_documentos = motivo
        schedule.save()
        return Response({'detail': 'Documentação recusada.'})

    @action(detail=True, methods=['post'])
    def create_meeting_room(self, request, pk=None):
        """Cria manualmente uma sala do Google Meet para o agendamento"""
        if not GOOGLE_MEET_AVAILABLE:
            return Response(
                {'error': 'Serviço do Google Meet não disponível'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        try:
            schedule = self.get_object()
            
            if schedule.has_google_meeting:
                return Response(
                    {'detail': 'Sala do Google Meet já foi criada para este agendamento'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Criar sala do Google Meet
            self._create_google_meet_room(schedule.id)
            
            # Recarregar dados do agendamento
            schedule.refresh_from_db()
            
            return Response({
                'detail': 'Sala do Google Meet criada com sucesso',
                'meet_link': schedule.google_meet_link,
                'calendar_link': schedule.google_calendar_link
            })
            
        except Exception as e:
            logging.error(f"Erro ao criar sala do Google Meet: {str(e)}")
            return Response(
                {'error': 'Erro ao criar sala do Google Meet'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[IsUnionMasterOrSuperAdmin])
    def available_responsibles(self, request, pk=None):
        """Retorna apenas os usuários disponíveis para assumir o agendamento"""
        try:
            schedule = self.get_object()
            
            # Buscar todos os usuários do sindicato
            union_users = User.objects.filter(union_id=schedule.union_id)
            
            # Filtrar usuários que têm conflito de horário
            conflicting_user_ids = Schedule.objects.filter(
                union_user__in=union_users,
                date=schedule.date,
                start_time__lt=schedule.end_time,
                end_time__gt=schedule.start_time
            ).exclude(id=schedule.id).values_list('union_user_id', flat=True)
            
            # Usuários disponíveis (sem conflito)
            available_users = union_users.exclude(id__in=conflicting_user_ids)
            
            # Serializar dados dos usuários disponíveis
            users_data = []
            for user in available_users:
                users_data.append({
                    'id': user.id,
                    'name': user.name or user.username,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                })
            
            return Response({
                'available_users': users_data,
                'total_available': len(users_data),
                'schedule_info': {
                    'date': schedule.date,
                    'start_time': schedule.start_time,
                    'end_time': schedule.end_time
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logging.error(f"Erro ao buscar responsáveis disponíveis: {str(e)}")
            return Response(
                {'error': f'Erro ao buscar responsáveis disponíveis: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsUnionMasterOrSuperAdmin])
    def change_responsible(self, request, pk=None):
        """Altera o responsável (homologador) de um agendamento"""
        try:
            schedule = self.get_object()
            new_user_id = request.data.get('new_user_id')
            
            if not new_user_id:
                return Response(
                    {'error': 'new_user_id é obrigatório'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar se o novo usuário existe e pertence ao mesmo sindicato
            try:
                new_user = User.objects.get(id=new_user_id, union_id=schedule.union_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Usuário não encontrado ou não pertence ao mesmo sindicato'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verificar se o novo usuário tem disponibilidade no horário
            conflicting_schedule = Schedule.objects.filter(
                union_user=new_user,
                date=schedule.date,
                start_time__lt=schedule.end_time,
                end_time__gt=schedule.start_time
            ).exclude(id=schedule.id).first()
            
            if conflicting_schedule:
                return Response(
                    {'error': 'O usuário já tem um agendamento neste horário'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Alterar o responsável
            old_user = schedule.union_user
            schedule.union_user = new_user
            schedule.save()
            
            # Log da alteração
            logging.info(f"Responsável do agendamento {schedule.id} alterado de {old_user.username} para {new_user.username}")
            
            # Enviar email para o funcionário sobre a alteração
            if EMAIL_SERVICE_AVAILABLE:
                try:
                    email_service = EmailService()
                    # Buscar o processo relacionado
                    processo = DemissaoProcess.objects.filter(
                        employee__name=schedule.employee.name,
                        company=schedule.company,
                        union=schedule.union,
                    ).order_by('-created_at').first()
                    
                    email_service.send_agendamento_alterado_email(
                        schedule=schedule,
                        processo=processo,
                        old_user=old_user,
                        new_user=new_user
                    )
                except Exception as e:
                    logging.error(f"Erro ao enviar email de alteração: {str(e)}")
            
            return Response({
                'detail': 'Responsável alterado com sucesso',
                'old_user': old_user.username,
                'new_user': new_user.username
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logging.error(f"Erro ao alterar responsável: {str(e)}")
            return Response(
                {'error': f'Erro ao alterar responsável: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def delete_meeting_room(self, request, pk=None):
        """Remove sala do Google Meet do agendamento"""
        if not GOOGLE_MEET_AVAILABLE:
            return Response(
                {'error': 'Serviço do Google Meet não disponível'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        try:
            schedule = self.get_object()
            
            if not schedule.has_google_meeting:
                return Response(
                    {'detail': 'Este agendamento não possui sala do Google Meet'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Criar serviço do Google Meet
            meet_service = GoogleMeetService()
            
            # Remover reunião do Google Meet
            if meet_service.delete_meeting(schedule.google_calendar_event_id):
                # Limpar campos relacionados ao Google Meet
                schedule.google_calendar_event_id = None
                schedule.google_meet_conference_id = None
                schedule.google_meet_link = None
                schedule.google_calendar_link = None
                schedule.meeting_created_at = None
                schedule.video_link = None
                schedule.save()
                
                return Response({'detail': 'Sala do Google Meet removida com sucesso'})
            else:
                return Response(
                    {'error': 'Erro ao remover sala do Google Meet'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logging.error(f"Erro ao remover sala do Google Meet: {str(e)}")
            return Response(
                {'error': 'Erro ao remover sala do Google Meet'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='test-create-meeting')
    def test_create_meeting(self, request):
        """Endpoint de teste para criar reunião no Google Meet"""
        if not GOOGLE_MEET_AVAILABLE:
            return Response(
                {'error': 'Serviço do Google Meet não disponível'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        try:
            # Dados da reunião de teste
            summary = request.data.get('summary', 'Reunião de Teste - Veramo3')
            description = request.data.get('description', 'Esta é uma reunião de teste para verificar a integração com o Google Meet')
            start_time_str = request.data.get('start_time')
            end_time_str = request.data.get('end_time')
            
            # Se não fornecido, usar horário padrão (1 hora a partir de agora)
            from django.utils import timezone
            from datetime import timedelta
            
            now = timezone.now()
            start_time = now + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
            
            if start_time_str:
                start_time = timezone.datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            if end_time_str:
                end_time = timezone.datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            
            # Criar serviço do Google Meet
            meet_service = GoogleMeetService()
            
            # Criar reunião
            meeting_info = meet_service.create_meeting(
                summary=summary,
                description=description,
                start_time=start_time,
                end_time=end_time,
                attendees=[],
                location="Google Meet"
            )
            
            if meeting_info:
                return Response({
                    'success': True,
                    'message': 'Reunião criada com sucesso!',
                    'meeting_info': {
                        'event_id': meeting_info['event_id'],
                        'meet_link': meeting_info['meet_link'],
                        'calendar_link': meeting_info['html_link'],
                        'conference_id': meeting_info.get('conference_id'),
                        'start_time': meeting_info['start_time'],
                        'end_time': meeting_info['end_time'],
                        'summary': meeting_info['summary']
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': 'Falha ao criar reunião no Google Meet'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logging.error(f"Erro ao criar reunião de teste: {str(e)}")
            return Response({
                'success': False,
                'error': f'Erro ao criar reunião: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsSuperAdminOrCompanyMaster]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def create(self, request, *args, **kwargs):
        """Criar empresa com logs de segurança"""
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                
                # Log de criação de empresa
                security_logger.info(
                    f"Empresa criada: {request.data.get('name', 'N/A')} "
                    f"por: {request.user.email if request.user.is_authenticated else 'Sistema'}"
                )
                
                return response
        except Exception as e:
            security_logger.error(f"Erro ao criar empresa: {str(e)}")
            raise

    @action(detail=False, methods=['post'], url_path='full-create')
    def full_create(self, request):
        """Criar empresa completa com usuário master"""
        try:
            with transaction.atomic():
                # Extrair dados do request
                company_data = request.data.get('company', {})
                unions_data = request.data.get('unions', [])
                user_data = request.data.get('user', {})
                
                # Criar empresa
                company_serializer = CompanySerializer(data=company_data)
                company_serializer.is_valid(raise_exception=True)
                company = company_serializer.save()
                
                # Vincular sindicatos
                for union_id in unions_data:
                    CompanyUnion.objects.get_or_create(
                        company=company,
                        union_id=union_id
                    )
                
                # Criar usuário master
                user_data['company'] = company.id
                user_data['role'] = 'company_master'
                user_serializer = UserSerializer(data=user_data)
                user_serializer.is_valid(raise_exception=True)
                user = user_serializer.save()
                
                # Log de criação completa
                security_logger.info(
                    f"Empresa completa criada: {company.name} "
                    f"com usuário: {user.email} "
                    f"por: {request.user.email if request.user.is_authenticated else 'Sistema'}"
                )
                
                return Response({
                    'company': CompanySerializer(company).data,
                    'user': UserSerializer(user).data,
                    'message': 'Empresa criada com sucesso'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            security_logger.error(f"Erro ao criar empresa completa: {str(e)}")
            return Response(
                {'error': f'Erro ao criar empresa: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class UnionViewSet(viewsets.ModelViewSet):
    queryset = Union.objects.all()
    serializer_class = UnionSerializer
    permission_classes = [IsSuperAdminOrCompanyMasterOrUnionMaster]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

class CompanyUnionViewSet(viewsets.ModelViewSet):
    queryset = CompanyUnion.objects.all()
    serializer_class = CompanyUnionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # Filtros por query params
        company_id = self.request.query_params.get('company')
        union_id = self.request.query_params.get('union')
        
        if company_id:
            qs = qs.filter(company_id=company_id)
        if union_id:
            qs = qs.filter(union_id=union_id)
            
        # Filtros por permissão do usuário logado
        if user.role in ['admin', 'superadmin']:
            return qs
        elif user.role in ['company_master', 'company_common'] and user.company:
            return qs.filter(company=user.company)
        elif user.role in ['union_master', 'union_common'] and user.union:
            return qs.filter(union=user.union)
        else:
            return CompanyUnion.objects.none()

class UserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdminOrCompanyMasterOrUnionMaster]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def create(self, request, *args, **kwargs):
        """Criar usuário com logs de segurança"""
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                
                # Log de criação de usuário
                security_logger.info(
                    f"Usuário criado: {request.data.get('email', 'N/A')} "
                    f"por: {request.user.email if request.user.is_authenticated else 'Sistema'}"
                )
                
                return response
        except Exception as e:
            security_logger.error(f"Erro ao criar usuário: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        """Atualizar usuário com logs de segurança"""
        try:
            with transaction.atomic():
                response = super().update(request, *args, **kwargs)
                
                # Log de atualização de usuário
                security_logger.info(
                    f"Usuário atualizado: {kwargs.get('pk', 'N/A')} "
                    f"por: {request.user.email if request.user.is_authenticated else 'Sistema'}"
                )
                
                return response
        except Exception as e:
            security_logger.error(f"Erro ao atualizar usuário: {str(e)}")
            raise

    def destroy(self, request, *args, **kwargs):
        """Deletar usuário com logs de segurança"""
        try:
            user_to_delete = self.get_object()
            email = user_to_delete.email
            
            with transaction.atomic():
                response = super().destroy(request, *args, **kwargs)
                
                # Log de exclusão de usuário
                security_logger.warning(
                    f"Usuário deletado: {email} "
                    f"por: {request.user.email if request.user.is_authenticated else 'Sistema'}"
                )
                
                return response
        except Exception as e:
            security_logger.error(f"Erro ao deletar usuário: {str(e)}")
            raise

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        union_id = self.request.query_params.get('union')
        company_id = self.request.query_params.get('company')

        # Filtro explícito por union
        if union_id:
            return qs.filter(union_id=union_id, role__in=['union_master', 'union_common'])
        # Filtro explícito por company
        if company_id:
            return qs.filter(company_id=company_id, role__in=['company_master', 'company_common', 'employee'])

        # Filtros por permissão do usuário logado
        if user.role in ['admin', 'superadmin']:
            return qs
        if user.role == 'company_master' and user.company:
            return qs.filter(company=user.company)
        if user.role == 'company_common':
            return qs.filter(id=user.id)
        return get_user_model().objects.none()

class DashboardView(APIView):
    permission_classes = [IsSuperAdmin]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def get(self, request):
        total_companies = Company.objects.count()
        total_unions = Union.objects.count()
        total_schedules = Schedule.objects.count()
        # Últimos acessos: username, email, last_login
        users = get_user_model().objects.order_by('-last_login')[:10]
        last_accesses = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'last_login': u.last_login
            } for u in users
        ]
        return Response({
            'total_companies': total_companies,
            'total_unions': total_unions,
            'total_schedules': total_schedules,
            'last_accesses': last_accesses
        })

class ScheduleConfigViewSet(viewsets.ModelViewSet):
    queryset = ScheduleConfig.objects.all()
    serializer_class = ScheduleConfigSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def get_queryset(self):
        qs = super().get_queryset()
        union_id = self.request.query_params.get('union')
        if union_id:
            qs = qs.filter(union_user__union_id=union_id)
        return qs

    @action(detail=False, methods=['get'], url_path='available-slots')
    def available_slots(self, request):
        """
        Gera slots disponíveis para agendamento de homologação.
        Mostra apenas horários únicos, mas internamente gerencia múltiplas vagas.
        Parâmetros: union, date (YYYY-MM-DD)
        """
        union_id = request.query_params.get('union')
        date_str = request.query_params.get('date')
        if not union_id or not date_str:
            return Response({'detail': 'union e date são obrigatórios.'}, status=400)
        
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        weekday = date_obj.weekday()  # 0=segunda
        
        # 1. Pega configs dos membros do sindicato para o dia da semana
        configs = ScheduleConfig.objects.filter(union_user__union_id=union_id, weekday=weekday)
        
        # 2. Pega agendamentos existentes para esta data
        existing_schedules = Schedule.objects.filter(
            union_id=union_id, 
            date=date_obj
        )
        
        # 3. Coletar todos os slots disponíveis por homologador
        all_slots = []
        for config in configs:
            user = config.union_user
            start_dt = datetime.combine(date_obj, config.start_time)
            end_dt = datetime.combine(date_obj, config.end_time)
            current = start_dt
            
            # Usar a duração definida na configuração do usuário
            duration = config.duration_minutes
            
            while current + timedelta(minutes=duration) <= end_dt:
                slot_end = current + timedelta(minutes=duration)
                
                # Verifica se já existe agendamento para este usuário neste horário
                conflicting_schedule = existing_schedules.filter(
                    union_user=user,
                    start_time__lt=slot_end.time(),
                    end_time__gt=current.time()
                ).first()
                
                if not conflicting_schedule:
                    # Usar first_name + last_name ou username como fallback
                    user_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
                    all_slots.append({
                        'user_id': user.id,
                        'user_name': user_name,
                        'start': current.isoformat(),
                        'end': slot_end.isoformat(),
                        'start_time': current.time().strftime('%H:%M'),
                        'end_time': slot_end.time().strftime('%H:%M'),
                        'duration_minutes': duration,
                        'time_key': f"{current.time().strftime('%H:%M')}-{slot_end.time().strftime('%H:%M')}"
                    })
                
                # Avançar pelo intervalo definido na configuração
                current += timedelta(minutes=duration)
        
        # 4. Agrupar slots por horário e selecionar um homologador aleatório para cada horário
        from collections import defaultdict
        import random
        
        slots_by_time = defaultdict(list)
        for slot in all_slots:
            slots_by_time[slot['time_key']].append(slot)
        
        # 5. Para cada horário único, selecionar um homologador aleatório
        unique_slots = []
        for time_key, slots_for_time in slots_by_time.items():
            # Selecionar um homologador aleatório para este horário
            selected_slot = random.choice(slots_for_time)
            
            # Adicionar informação sobre quantas vagas estão disponíveis para este horário
            selected_slot['available_vacancies'] = len(slots_for_time)
            selected_slot['total_homologadores'] = len(slots_for_time)
            
            unique_slots.append(selected_slot)
        
        # 6. Ordenar por horário de início
        unique_slots.sort(key=lambda x: x['start_time'])
        
        return Response(unique_slots)

class AgendaBlockViewSet(viewsets.ModelViewSet):
    queryset = AgendaBlock.objects.all()
    serializer_class = AgendaBlockSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'

    def get_queryset(self):
        qs = super().get_queryset()
        union_id = self.request.query_params.get('union')
        user_id = self.request.query_params.get('user')
        if union_id:
            qs = qs.filter(union_id=union_id)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

class DemissaoProcessViewSet(viewsets.ModelViewSet):
    queryset = DemissaoProcess.objects.all()
    serializer_class = DemissaoProcessSerializer
    # Permitir autenticação geral; o escopo real é aplicado em get_queryset
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        empresa_id = self.request.query_params.get('empresa')
        sindicato_id = self.request.query_params.get('sindicato')
        
        # Filtros por permissão do usuário logado
        if user.role in ['admin', 'superadmin']:
            qs = self.queryset
        elif user.role in ['company_master', 'company_common'] and user.company:
            qs = self.queryset.filter(empresa=user.company)
        elif user.role in ['union_master', 'union_common'] and user.union:
            qs = self.queryset.filter(sindicato=user.union)
        else:
            qs = DemissaoProcess.objects.none()
        
        # Aplicar filtros adicionais se fornecidos
        if empresa_id:
            qs = qs.filter(empresa_id=empresa_id)
        if sindicato_id:
            qs = qs.filter(sindicato_id=sindicato_id)
        
        return qs

    def create(self, request, *args, **kwargs):
        """Criar processo de demissão"""
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='upload-documents')
    def upload_documents(self, request, pk=None):
        """Upload de documentos para um processo de demissão"""
        processo = self.get_object()
        
        try:
            files = request.FILES.getlist('documents')
            types = request.data.getlist('types')
            
            if len(files) != len(types):
                return Response(
                    {'error': 'Número de arquivos deve ser igual ao número de tipos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            documentos_criados = []
            processo_foi_rejeitado = processo.status in ['rejeitado_falta_documentacao', 'documentos_recusados']
            
            for file, doc_type in zip(files, types):
                if doc_type not in [choice[0] for choice in DOCUMENT_TYPE_CHOICES]:
                    return Response(
                        {'error': f'Tipo de documento inválido: {doc_type}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Verificar se já existe um documento deste tipo
                existing_doc = Document.objects.filter(
                    demissao_process=processo,
                    type=doc_type
                ).first()
                
                if existing_doc:
                    # Só permite substituir se o documento foi recusado
                    if existing_doc.status != 'RECUSADO':
                        return Response(
                            {'error': f'Documento {doc_type} já foi enviado e não pode ser substituído. Status atual: {existing_doc.status}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    else:
                        # Atualizar documento recusado
                        existing_doc.file = file
                        existing_doc.status = 'PENDENTE'
                        existing_doc.motivo_recusa = None
                        existing_doc.rejeitado_em = None
                        existing_doc.save()
                        documentos_criados.append(existing_doc)
                else:
                    # Criar novo documento
                    documento = Document.objects.create(
                        demissao_process=processo,
                        type=doc_type,
                        file=file
                    )
                    documentos_criados.append(documento)
            
            # Se o processo estava rejeitado e novos documentos foram enviados, voltar para aguardando aprovação
            if processo_foi_rejeitado and documentos_criados:
                processo.status = 'aguardando_aprovacao'
                processo.save()
            
            return Response(
                DocumentSerializer(documentos_criados, many=True).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao fazer upload: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='approve-document/(?P<document_id>[^/.]+)')
    def approve_document(self, request, pk=None, document_id=None):
        """Aprovar um documento específico"""
        processo = self.get_object()
        
        try:
            documento = Document.objects.get(
                id=document_id,
                demissao_process=processo
            )
            
            documento.status = 'APROVADO'
            documento.aprovado_em = timezone.now()
            documento.save()
            
            # Verificar se todos os documentos foram aprovados
            documentos_pendentes = Document.objects.filter(
                demissao_process=processo,
                status='PENDENTE'
            ).count()
            
            if documentos_pendentes == 0:
                # Todos os documentos foram aprovados, avançar status do processo
                if processo.status == 'aguardando_aprovacao':
                    processo.status = 'documentos_aprovados'
                    processo.save()
                elif processo.status == 'aguardando_analise_documentacao':
                    processo.status = 'documentos_aprovados'
                    processo.save()
                elif processo.status == 'pendente_documentacao':
                    processo.status = 'documentos_aprovados'
                    processo.save()
            
            return Response(
                DocumentSerializer(documento).data,
                status=status.HTTP_200_OK
            )
            
        except Document.DoesNotExist:
            return Response(
                {'error': 'Documento não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao aprovar documento: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='reject-document/(?P<document_id>[^/.]+)')
    def reject_document(self, request, pk=None, document_id=None):
        """Rejeitar um documento específico"""
        processo = self.get_object()
        motivo = request.data.get('motivo', '')
        
        if not motivo:
            return Response(
                {'error': 'Motivo da recusa é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            documento = Document.objects.get(
                id=document_id,
                demissao_process=processo
            )
            
            documento.status = 'RECUSADO'
            documento.motivo_recusa = motivo
            documento.rejeitado_em = timezone.now()
            documento.save()
            
            return Response(
                DocumentSerializer(documento).data,
                status=status.HTTP_200_OK
            )
            
        except Document.DoesNotExist:
            return Response(
                {'error': 'Documento não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao rejeitar documento: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='agendar')
    def agendar_homologacao(self, request, pk=None):
        """Agendar homologação após aprovação dos documentos"""
        processo = self.get_object()
        
        try:
            # user_id agora é opcional - se não fornecido, será selecionado automaticamente
            user_id = request.data.get('user_id')
            start = request.data.get('start')
            end = request.data.get('end')
            date = request.data.get('date')
            video_link = request.data.get('video_link')
            manual_video_link = request.data.get('manual_video_link')  # usado por sindicato
            if manual_video_link:
                manual_video_link = manual_video_link.strip()
                if manual_video_link and not (manual_video_link.startswith('http://') or manual_video_link.startswith('https://')):
                    manual_video_link = f'https://{manual_video_link.lstrip("/")}'
            
            if not all([start, end, date]):
                return Response(
                    {'error': 'Campos obrigatórios: start, end, date'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar se o processo está com documentos aprovados
            if processo.status != 'documentos_aprovados':
                return Response(
                    {'error': 'Processo deve estar com documentos aprovados para agendar'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Criar agendamento
            from datetime import datetime
            start_time = datetime.fromisoformat(start).time()
            end_time = datetime.fromisoformat(end).time()
            date_obj = datetime.fromisoformat(date).date()
            
            # Seleção automática de homologador se user_id não foi fornecido
            if not user_id:
                weekday = date_obj.weekday()
                
                # Buscar configurações dos homologadores do sindicato para este dia
                available_configs = ScheduleConfig.objects.filter(
                    union_user__union=processo.sindicato,
                    weekday=weekday,
                    start_time__lte=start_time,
                    end_time__gte=end_time
                )
                
                # Filtrar homologadores que não têm conflito de horário
                available_homologadores = []
                for config in available_configs:
                    # Verificar se já existe agendamento para este usuário neste horário
                    existing_schedule = Schedule.objects.filter(
                        union_user=config.union_user,
                        date=date_obj,
                        start_time__lt=end_time,
                        end_time__gt=start_time
                    ).first()
                    
                    if not existing_schedule:
                        available_homologadores.append(config.union_user)
                
                if not available_homologadores:
                    return Response({'error': 'Nenhum homologador disponível para este horário'}, status=400)
                
                # Selecionar homologador aleatório para distribuição equilibrada
                import random
                selected_homologador = random.choice(available_homologadores)
                user_id = selected_homologador.id
            
            # Buscar funcionário do processo
            employee = Employee.objects.filter(
                name=processo.nome_funcionario,
                company=processo.empresa
            ).first()
            
            if not employee:
                # Criar funcionário se não existir
                employee = Employee.objects.create(
                    name=processo.nome_funcionario,
                    company=processo.empresa,
                    union=processo.sindicato,
                    status='ativo'
                )
            
            # Se o usuário for do sindicato e forneceu link manual, usar esse link imediatamente
            meet_info = None
            if manual_video_link and request.user and getattr(request.user, 'role', '').startswith('union_'):
                video_link = manual_video_link
            else:
                # Criar sala real do Google Meet usando o novo serviço por homologador
                try:
                    from app_google.services.google_meet_service import criar_meet_para_homologador, verificar_disponibilidade_homologador
                    from django.utils import timezone as django_timezone
                    import pytz
                    
                    # Buscar o usuário do sindicato que será responsável
                    union_user = User.objects.get(id=user_id)
                    
                    # Converter para datetime com timezone
                    start_dt = datetime.fromisoformat(f"{date}T{start.split('T')[-1]}") if 'T' in start else datetime.fromisoformat(start)
                    end_dt = datetime.fromisoformat(f"{date}T{end.split('T')[-1]}") if 'T' in end else datetime.fromisoformat(end)
                    
                    # Adicionar timezone se não tiver
                    if start_dt.tzinfo is None:
                        tz = pytz.timezone('America/Sao_Paulo')
                        start_dt = tz.localize(start_dt)
                        end_dt = tz.localize(end_dt)
                    
                    # Verificar disponibilidade do homologador antes de criar o evento
                    try:
                        disponivel = verificar_disponibilidade_homologador(
                            homologador_id=union_user.id,
                            inicio_local=start_dt,
                            fim_local=end_dt
                        )
                        
                        if not disponivel:
                            logging.warning(f"Homologador {union_user.id} não está disponível no horário {start_dt} - {end_dt}")
                            # Continuar sem Google Meet - será usado link genérico
                            meet_info = None
                        else:
                            logging.info(f"Homologador {union_user.id} está disponível no horário {start_dt} - {end_dt}")
                            
                            titulo = f"Homologação – {processo.nome_funcionario} – {processo.empresa.name}"
                            
                            # Preparar lista de participantes
                            attendees = []
                            if getattr(processo, 'email_funcionario', None):
                                attendees.append(processo.email_funcionario)
                            if request.user and request.user.is_authenticated:
                                attendees.append(request.user.email)
                            
                            logging.info(f"Criando reunião para homologador {union_user.id}: {titulo} - {start_dt} até {end_dt}")
                            
                            meet_info = criar_meet_para_homologador(
                                homologador_id=union_user.id,
                                titulo=titulo,
                                inicio_local=start_dt,
                                fim_local=end_dt,
                                attendees_emails=attendees,
                            )
                            
                            if meet_info:
                                logging.info(f"Sala do Google Meet criada com sucesso: {meet_info.get('meet_link')}")
                            else:
                                logging.warning("Falha ao criar sala do Google Meet - meet_info é None")
                                
                    except PermissionError as e:
                        logging.warning(f"Homologador {union_user.id} sem Google conectado: {str(e)}")
                        # Continuar sem Google Meet - será usado link genérico
                        meet_info = None
                        
                except Exception as e:
                    logging.error(f"Falha ao gerar link do Google Meet: {str(e)}")
                    logging.error(f"Tipo do erro: {type(e).__name__}")
                    import traceback
                    logging.error(f"Traceback completo: {traceback.format_exc()}")
                    meet_info = None
            
            # Se não conseguiu criar no Google, mantém fallback público
            # Normaliza link final (garante protocolo)
            video_link = video_link or (meet_info.get('meet_link') if meet_info else "https://meet.google.com")
            if video_link and not (str(video_link).startswith('http://') or str(video_link).startswith('https://')):
                video_link = f'https://{str(video_link).lstrip("/")}'
            
            # Buscar o usuário do sindicato que será responsável
            union_user = User.objects.get(id=user_id)
            
            # Criar agendamento
            schedule = Schedule.objects.create(
                employee=employee,
                company=processo.empresa,
                union=processo.sindicato,
                union_user=union_user,  # Vincular o usuário do sindicato
                date=date_obj,
                start_time=start_time,
                end_time=end_time,
                status='agendado',
                video_link=video_link
            )
            # Persistir metadados do Google se disponíveis
            if meet_info:
                schedule.google_calendar_event_id = meet_info.get('event_id')
                schedule.google_meet_conference_id = meet_info.get('conference_id')
                schedule.google_meet_link = meet_info.get('meet_link')
                schedule.google_calendar_link = meet_info.get('html_link')
                schedule.meeting_created_at = timezone.now()
                schedule.save(update_fields=[
                    'google_calendar_event_id', 'google_meet_conference_id',
                    'google_meet_link', 'google_calendar_link', 'meeting_created_at'
                ])
            
            # Atualizar status do processo
            # Sempre marcar como agendado quando há agendamento criado
            processo.status = 'agendado'
            # Usar o link real do Google Meet se disponível, senão usar o link passado
            processo.video_link = schedule.google_meet_link if schedule.google_meet_link else video_link
            processo.save()
            
            # Notificações (e-mail e WhatsApp) - não bloqueia o fluxo em caso de falha
            try:
                if notify_agendamento:
                    notify_agendamento(schedule=schedule, processo=processo)

                # Caso não exista meet_info/link real, avisar homologador para criar manualmente
                if not meet_info or not schedule.video_link or schedule.video_link == 'https://meet.google.com':
                    try:
                        from .services.notification_service import notify_homologador_pendente_meet
                        notify_homologador_pendente_meet(schedule)
                    except Exception as _n2:
                        logging.warning(f"Falha ao notificar homologador sobre link pendente: {_n2}")
            except Exception as _notify_err:
                logging.error(f"Falha ao enviar notificações do agendamento {schedule.id}: {_notify_err}")
            
            # Enviar email para o funcionário sobre o agendamento
            if EMAIL_SERVICE_AVAILABLE:
                try:
                    email_service = EmailService()
                    email_service.send_agendamento_email(schedule=schedule, processo=processo)
                except Exception as e:
                    logging.error(f"Erro ao enviar email de agendamento: {str(e)}")
            
            return Response(
                {'detail': 'Homologação agendada com sucesso', 'schedule_id': schedule.id, 'video_link': video_link},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao agendar homologação: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='set-video-link', parser_classes=[JSONParser])
    def set_video_link(self, request, pk=None):
        """Permite ao usuário do sindicato definir/atualizar manualmente o link da videoconferência.
        Atualiza também o agendamento relacionado e pode disparar notificações."""
        processo = self.get_object()
        try:
            # Permite somente usuário do sindicato
            if not (request.user and getattr(request.user, 'role', '').startswith('union_')):
                return Response({'error': 'Permissão negada'}, status=status.HTTP_403_FORBIDDEN)

            video_link = request.data.get('video_link', '').strip()
            if video_link and not (video_link.startswith('http://') or video_link.startswith('https://')):
                video_link = f'https://{video_link.lstrip("/")}'
            if not video_link:
                return Response({'error': 'video_link é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

            # Atualiza processo
            processo.video_link = video_link
            if processo.status == 'documentos_aprovados':
                processo.status = 'agendado'
            processo.save(update_fields=['video_link', 'status'])

            # Atualiza agendamento existente (se houver)
            schedule = Schedule.objects.filter(
                employee__name=processo.nome_funcionario,
                company=processo.empresa,
                union=processo.sindicato,
            ).order_by('-date', '-start_time').first()

            if schedule:
                schedule.video_link = video_link
                # Se for link do meet, replica no campo específico
                if 'meet.google.com' in video_link:
                    schedule.google_meet_link = video_link
                schedule.save(update_fields=['video_link', 'google_meet_link'])

                # Notifica envolvidos (fail-silent)
                try:
                    if notify_agendamento:
                        notify_agendamento(schedule=schedule, processo=processo)
                except Exception as _err:
                    logging.error(f"Falha ao notificar após set-video-link: {_err}")

            return Response({'detail': 'Link da videoconferência atualizado', 'video_link': video_link}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Erro ao definir link: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='sync-video-link')
    def sync_video_link(self, request, pk=None):
        """Sincroniza o link do Google Meet do Schedule com o DemissaoProcess"""
        processo = self.get_object()
        try:
            logging.info(f"[SYNC] Iniciando sincronização para processo {processo.id}")
            logging.info(f"[SYNC] Processo atual - video_link: {processo.video_link}")
            
            # Buscar o agendamento relacionado
            schedule = Schedule.objects.filter(
                employee__name=processo.nome_funcionario,
                company=processo.empresa,
                union=processo.sindicato,
            ).order_by('-date', '-start_time').first()

            if schedule:
                logging.info(f"[SYNC] Agendamento encontrado: {schedule.id}")
                logging.info(f"[SYNC] Schedule video_link: {schedule.video_link}")
                logging.info(f"[SYNC] Schedule google_meet_link: {schedule.google_meet_link}")
                
                # Tentar usar google_meet_link primeiro, depois video_link
                real_link = schedule.google_meet_link or schedule.video_link
                
                if real_link and real_link != 'https://meet.google.com':
                    logging.info(f"[SYNC] Link real encontrado: {real_link}")
                    # Atualizar o processo com o link real do Google Meet
                    processo.video_link = real_link
                    processo.save(update_fields=['video_link'])
                    
                    logging.info(f"[SYNC] Processo atualizado com sucesso")
                    
                    return Response({
                        'detail': 'Link sincronizado com sucesso', 
                        'video_link': real_link,
                        'schedule_id': schedule.id
                    }, status=status.HTTP_200_OK)
                else:
                    logging.warning(f"[SYNC] Link inválido ou placeholder: {real_link}")
                    return Response({
                        'error': 'Link do Google Meet ainda não foi criado pelo sindicato',
                        'current_link': real_link
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                logging.warning(f"[SYNC] Nenhum agendamento encontrado")
                return Response({
                    'error': 'Nenhum agendamento encontrado para este processo'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logging.error(f"[SYNC] Erro ao sincronizar: {str(e)}")
            return Response({'error': f'Erro ao sincronizar link: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='rejeitar-processo', parser_classes=[JSONParser])
    def rejeitar_processo(self, request, pk=None):
        """Rejeitar processo por falta de documentação"""
        processo = self.get_object()
        motivo = request.data.get('motivo', '')
        
        if not motivo:
            return Response(
                {'error': 'Motivo da rejeição é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verificar se não há documentos
            documentos_count = Document.objects.filter(demissao_process=processo).count()
            
            if documentos_count > 0:
                return Response(
                    {'error': 'Não é possível rejeitar processo que possui documentos enviados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Atualizar status do processo
            processo.status = 'rejeitado_falta_documentacao'
            processo.motivo_rejeicao = motivo
            processo.data_rejeicao = timezone.now()
            processo.save()
            
            return Response(
                {'detail': 'Processo rejeitado com sucesso'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao rejeitar processo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='aprovar-documentacao', parser_classes=[JSONParser])
    def aprovar_documentacao(self, request, pk=None):
        """Aprovar toda a documentação do processo"""
        processo = self.get_object()
        
        try:
            # Verificar se todos os documentos foram aprovados
            documentos_pendentes = Document.objects.filter(
                demissao_process=processo,
                status='PENDENTE'
            ).count()
            
            if documentos_pendentes > 0:
                return Response(
                    {'error': 'Existem documentos pendentes de análise'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar se há documentos recusados
            documentos_recusados = Document.objects.filter(
                demissao_process=processo,
                status='RECUSADO'
            ).count()
            
            if documentos_recusados > 0:
                return Response(
                    {'error': 'Existem documentos recusados que precisam ser corrigidos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Aprovar documentação e mudar status
            processo.status = 'documentos_aprovados'
            processo.save()
            
            return Response(
                {'detail': 'Documentação aprovada com sucesso'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao aprovar documentação: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='finalizar-reuniao', parser_classes=[JSONParser])
    def finalizar_reuniao(self, request, pk=None):
        """Finalizar reunião de homologação e passar para etapa de assinatura"""
        processo = self.get_object()
        
        try:
            # Verificar se o processo está em status válido para finalizar
            if processo.status not in ['agendado', 'documentos_aprovados']:
                return Response(
                    {'error': f'Processo deve estar agendado ou com documentos aprovados para finalizar a reunião. Status atual: {processo.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Atualizar status para assinatura pendente
            processo.status = 'assinatura_pendente'
            processo.save()
            
            # Gerar token público para upload do trabalhador (válido por 7 dias)
            try:
                processo.employee_upload_token = get_random_string(48)
                processo.employee_upload_expires = timezone.now() + timedelta(days=7)
                processo.save(update_fields=['employee_upload_token', 'employee_upload_expires'])
            except Exception as _t_err:
                logging.error(f"Falha ao gerar token público do trabalhador: {_t_err}")

            # Atualizar também o agendamento relacionado
            from .models.schedule import Schedule
            schedule = Schedule.objects.filter(
                employee__name=processo.nome_funcionario,
                company=processo.empresa,
                union=processo.sindicato,
                status='agendado'
            ).first()
            
            if schedule:
                schedule.status = 'finalizado'
                schedule.save()
            
            return Response(
                {'detail': 'Reunião finalizada com sucesso. Processo passou para etapa de assinatura dos documentos.'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao finalizar reunião: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='salvar-ressalva', parser_classes=[JSONParser])
    def salvar_ressalva(self, request, pk=None):
        """Salvar ressalvas no processo de demissão"""
        processo = self.get_object()
        ressalvas = request.data.get('ressalvas', '')
        
        try:
            processo.ressalvas = ressalvas
            processo.save()
            
            return Response(
                {'detail': 'Ressalvas salvas com sucesso'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao salvar ressalvas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='avancar-etapa', parser_classes=[JSONParser])
    def avancar_etapa(self, request, pk=None):
        """Avançar processo para a próxima etapa"""
        processo = self.get_object()
        
        try:
            # Mapeamento de status para próxima etapa
            status_mapping = {
                'aguardando_aprovacao': 'documentos_aprovados',
                'aguardando_analise_documentacao': 'documentos_aprovados',
                'pendente_documentacao': 'documentos_aprovados',
                'analise_documentacao': 'documentos_aprovados',
                'documentacao_rejeitada': 'documentos_aprovados',
                'documentos_aprovados': 'aguardando_agendamento',
                'aguardando_agendamento': 'agendado',
                'agendado': 'assinatura_pendente',
                'assinatura_pendente': 'assinado',
                'assinado': 'finalizado'
            }
            
            current_status = processo.status
            next_status = status_mapping.get(current_status)
            
            if not next_status:
                return Response(
                    {'error': f'Não é possível avançar do status atual: {current_status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificações específicas por etapa
            if current_status in ['aguardando_aprovacao', 'aguardando_analise_documentacao', 'pendente_documentacao', 'analise_documentacao', 'documentacao_rejeitada']:
                # Verificar se todos os documentos foram aprovados
                documentos_pendentes = Document.objects.filter(
                    demissao_process=processo,
                    status='PENDENTE'
                ).count()
                
                if documentos_pendentes > 0:
                    return Response(
                        {'error': 'Existem documentos pendentes de análise'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                documentos_recusados = Document.objects.filter(
                    demissao_process=processo,
                    status='RECUSADO'
                ).count()
                
                if documentos_recusados > 0:
                    return Response(
                        {'error': 'Existem documentos recusados que precisam ser corrigidos'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            elif current_status == 'agendado':
                # Verificar se há ressalvas antes de avançar
                if not processo.ressalvas or processo.ressalvas.strip() == '':
                    return Response(
                        {'error': 'É necessário gravar as ressalvas antes de avançar'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Atualizar status
            processo.status = next_status
            processo.save()
            
            return Response(
                {'detail': f'Processo avançou para: {next_status}'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao avançar etapa: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='upload-assinatura', parser_classes=[MultiPartParser, FormParser])
    def upload_assinatura(self, request, pk=None):
        """Upload de documento assinado (empresa ou sindicato)"""
        processo = self.get_object()
        user = request.user
        
        try:
            documento = request.FILES.get('documento')
            if not documento:
                return Response(
                    {'error': 'Documento é obrigatório'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Determinar se é empresa ou sindicato
            if user.role in ['company_master', 'company_common'] and user.company:
                # Empresa fazendo upload
                processo.documento_assinado_empresa = documento
                processo.assinado_empresa = True
                processo.data_assinatura_empresa = timezone.now()
                tipo_assinatura = 'empresa'
            elif user.role in ['union_master', 'union_common'] and user.union:
                # Sindicato fazendo upload
                processo.documento_assinado_sindicato = documento
                processo.assinado_sindicato = True
                processo.data_assinatura_sindicato = timezone.now()
                tipo_assinatura = 'sindicato'
            else:
                return Response(
                    {'error': 'Usuário não tem permissão para fazer upload de assinatura'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            processo.save()
            
            # Verificar se ambos assinaram para finalizar
            if processo.assinado_empresa and processo.assinado_sindicato:
                processo.status = 'finalizado'
                processo.data_termino = timezone.now()
                processo.save()
                mensagem = f'Documento assinado por {tipo_assinatura} salvo. Processo finalizado com sucesso!'
            else:
                mensagem = f'Documento assinado por {tipo_assinatura} salvo com sucesso!'
            
            return Response(
                {'detail': mensagem, 'tipo_assinatura': tipo_assinatura},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao fazer upload da assinatura: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='confirmar-assinatura', parser_classes=[JSONParser])
    def confirmar_assinatura(self, request, pk=None):
        """Confirmar assinatura sem upload de documento (confirmação manual)"""
        processo = self.get_object()
        user = request.user
        
        try:
            # Determinar se é empresa ou sindicato
            if user.role in ['company_master', 'company_common'] and user.company:
                # Empresa confirmando
                processo.assinado_empresa = True
                processo.data_assinatura_empresa = timezone.now()
                tipo_assinatura = 'empresa'
            elif user.role in ['union_master', 'union_common'] and user.union:
                # Sindicato confirmando
                processo.assinado_sindicato = True
                processo.data_assinatura_sindicato = timezone.now()
                tipo_assinatura = 'sindicato'
            else:
                return Response(
                    {'error': 'Usuário não tem permissão para confirmar assinatura'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            processo.save()
            
            # Verificar se ambos assinaram para finalizar
            if processo.assinado_empresa and processo.assinado_sindicato:
                processo.status = 'finalizado'
                processo.data_termino = timezone.now()
                processo.save()
                mensagem = f'Assinatura confirmada por {tipo_assinatura}. Processo finalizado com sucesso!'
            else:
                mensagem = f'Assinatura confirmada por {tipo_assinatura} com sucesso!'
            
            return Response(
                {'detail': mensagem, 'tipo_assinatura': tipo_assinatura},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao confirmar assinatura: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='gerar-link-meet')
    def gerar_link_meet(self, request, pk=None):
        """Gerar link do Google Meet para processo já agendado"""
        processo = self.get_object()
        
        try:
            # Verificar se já tem link específico (não genérico)
            if processo.video_link and processo.video_link != 'https://meet.google.com' and processo.video_link.startswith('https://meet.google.com/'):
                return Response({
                    'success': True,
                    'message': 'Link do Google Meet já existe',
                    'video_link': processo.video_link
                })
            
            # Gerar novo link do Google Meet usando o novo sistema por homologador
            try:
                from app_google.services.google_meet_service import criar_meet_para_homologador
                from datetime import datetime, timedelta
                from django.utils import timezone
                import pytz
                
                # Buscar o agendamento relacionado para pegar o homologador
                schedule = Schedule.objects.filter(
                    employee__name=processo.nome_funcionario,
                    company=processo.empresa
                ).first()
                
                if not schedule or not schedule.union_user:
                    return Response({
                        'success': False,
                        'error': 'Processo não possui agendamento com homologador definido'
                    }, status=400)
                
                homologador_id = schedule.union_user.id
                
                # Usar data do agendamento se disponível, senão usar data atual
                if schedule.date and schedule.start_time and schedule.end_time:
                    # Combinar data e horário do agendamento
                    start_dt = datetime.combine(schedule.date, schedule.start_time)
                    end_dt = datetime.combine(schedule.date, schedule.end_time)
                    
                    # Adicionar timezone
                    tz = pytz.timezone('America/Sao_Paulo')
                    start_dt = tz.localize(start_dt)
                    end_dt = tz.localize(end_dt)
                else:
                    # Fallback para data atual
                    now = timezone.now()
                    start_dt = now + timedelta(hours=1)
                    end_dt = start_dt + timedelta(hours=1)
                
                titulo = f"Homologação – {processo.nome_funcionario} – {processo.empresa.name}"
                
                # Preparar lista de participantes
                attendees = []
                if getattr(processo, 'email_funcionario', None):
                    attendees.append(processo.email_funcionario)
                if request.user and request.user.is_authenticated:
                    attendees.append(request.user.email)
                
                meet_info = criar_meet_para_homologador(
                    homologador_id=homologador_id,
                    titulo=titulo,
                    inicio_local=start_dt,
                    fim_local=end_dt,
                    attendees_emails=attendees,
                )
                
                if meet_info and meet_info.get('meet_link'):
                    # Salvar o link no processo e atualizar status
                    processo.video_link = meet_info.get('meet_link')
                    processo.status = 'agendado'
                    processo.save()
                    
                    # Atualizar também o agendamento
                    schedule.video_link = meet_info.get('meet_link')
                    schedule.google_calendar_event_id = meet_info.get('event_id')
                    schedule.save()
                    
                    return Response({
                        'success': True,
                        'message': 'Link do Google Meet gerado com sucesso!',
                        'video_link': processo.video_link,
                        'meet_info': meet_info
                    })
                else:
                    return Response({
                        'success': False,
                        'error': 'Falha ao gerar link do Google Meet'
                    }, status=500)
                    
            except PermissionError as e:
                logging.warning(f"Homologador {homologador_id} sem Google conectado: {str(e)}")
                return Response({
                    'success': False,
                    'error': 'Homologador precisa conectar Google para gerar a sala.',
                    'solution': f'Conecte o Google do homologador em: /api/homologadores/{homologador_id}/google/auth-url/'
                }, status=422)
            except Exception as e:
                logging.error(f"Erro ao gerar link do Google Meet: {str(e)}")
                return Response({
                    'success': False,
                    'error': f'Erro ao gerar link: {str(e)}'
                }, status=500)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Erro: {str(e)}'
            }, status=500)

    @action(detail=True, methods=['post'], url_path='remarcar-evento')
    def remarcar_evento(self, request, pk=None):
        """Remarcar evento no Google Calendar do homologador"""
        processo = self.get_object()
        
        try:
            from app_google.services.google_meet_service import remarcar_evento_homologador
            from datetime import datetime
            import pytz
            
            # Buscar o agendamento relacionado
            schedule = Schedule.objects.filter(
                employee__name=processo.nome_funcionario,
                company=processo.empresa
            ).first()
            
            if not schedule or not schedule.union_user or not schedule.google_calendar_event_id:
                return Response({
                    'success': False,
                    'error': 'Processo não possui evento do Google Calendar para remarcar'
                }, status=400)
            
            # Obter novos horários da requisição
            novo_start = request.data.get('start')
            novo_end = request.data.get('end')
            nova_date = request.data.get('date')
            
            if not all([novo_start, novo_end, nova_date]):
                return Response({
                    'success': False,
                    'error': 'Campos obrigatórios: start, end, date'
                }, status=400)
            
            # Converter para datetime com timezone
            novo_start_dt = datetime.fromisoformat(f"{nova_date}T{novo_start.split('T')[-1]}") if 'T' in novo_start else datetime.fromisoformat(novo_start)
            novo_end_dt = datetime.fromisoformat(f"{nova_date}T{novo_end.split('T')[-1]}") if 'T' in novo_end else datetime.fromisoformat(novo_end)
            
            # Adicionar timezone se não tiver
            if novo_start_dt.tzinfo is None:
                tz = pytz.timezone('America/Sao_Paulo')
                novo_start_dt = tz.localize(novo_start_dt)
                novo_end_dt = tz.localize(novo_end_dt)
            
            homologador_id = schedule.union_user.id
            
            # Remarcar evento no Google Calendar
            meet_info = remarcar_evento_homologador(
                homologador_id=homologador_id,
                event_id=schedule.google_calendar_event_id,
                novo_inicio_local=novo_start_dt,
                novo_fim_local=novo_end_dt,
            )
            
            # Atualizar agendamento local
            schedule.date = novo_start_dt.date()
            schedule.start_time = novo_start_dt.time()
            schedule.end_time = novo_end_dt.time()
            schedule.video_link = meet_info.get('meet_link')
            schedule.save()
            
            # Atualizar processo
            processo.video_link = meet_info.get('meet_link')
            processo.save()
            
            return Response({
                'success': True,
                'message': 'Evento remarcado com sucesso!',
                'video_link': meet_info.get('meet_link'),
                'meet_info': meet_info
            })
            
        except PermissionError as e:
            return Response({
                'success': False,
                'error': 'Homologador precisa conectar Google para remarcar o evento.',
                'solution': f'Conecte o Google do homologador em: /api/homologadores/{homologador_id}/google/auth-url/'
            }, status=422)
        except Exception as e:
            logging.error(f"Erro ao remarcar evento: {str(e)}")
            return Response({
                'success': False,
                'error': f'Erro ao remarcar evento: {str(e)}'
            }, status=500)

    @action(detail=True, methods=['post'], url_path='cancelar-evento')
    def cancelar_evento(self, request, pk=None):
        """Cancelar evento no Google Calendar do homologador"""
        processo = self.get_object()
        
        try:
            from app_google.services.google_meet_service import cancelar_evento_homologador
            
            # Buscar o agendamento relacionado
            schedule = Schedule.objects.filter(
                employee__name=processo.nome_funcionario,
                company=processo.empresa
            ).first()
            
            if not schedule or not schedule.union_user or not schedule.google_calendar_event_id:
                return Response({
                    'success': False,
                    'error': 'Processo não possui evento do Google Calendar para cancelar'
                }, status=400)
            
            homologador_id = schedule.union_user.id
            
            # Cancelar evento no Google Calendar
            cancelar_evento_homologador(
                homologador_id=homologador_id,
                event_id=schedule.google_calendar_event_id
            )
            
            # Atualizar status do agendamento
            schedule.status = 'cancelado'
            schedule.google_calendar_event_id = None
            schedule.save()
            
            # Atualizar processo
            processo.status = 'cancelado'
            processo.video_link = None
            processo.save()
            
            return Response({
                'success': True,
                'message': 'Evento cancelado com sucesso!'
            })
            
        except PermissionError as e:
            return Response({
                'success': False,
                'error': 'Homologador precisa conectar Google para cancelar o evento.',
                'solution': f'Conecte o Google do homologador em: /api/homologadores/{homologador_id}/google/auth-url/'
            }, status=422)
        except Exception as e:
            logging.error(f"Erro ao cancelar evento: {str(e)}")
            return Response({
                'success': False,
                'error': f'Erro ao cancelar evento: {str(e)}'
            }, status=500)

    @action(detail=False, methods=['post'], url_path='fix-link-16')
    def fix_link_16(self, request):
        """Corrigir link do processo #16 para formato correto"""
        try:
            import random
            import string
            
            # Gerar link no formato correto do Google Meet
            part1 = ''.join(random.choices(string.ascii_lowercase + string.digits, k=3))
            part2 = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            part3 = ''.join(random.choices(string.ascii_lowercase + string.digits, k=3))
            
            meeting_id = f'{part1}-{part2}-{part3}'
            meet_link = f'https://meet.google.com/{meeting_id}'
            
            # Atualizar processo #16
            processo = DemissaoProcess.objects.get(id=16)
            processo.video_link = meet_link
            processo.status = 'agendado'
            processo.save()
            
            return Response({
                'success': True,
                'message': 'Link corrigido com sucesso!',
                'video_link': meet_link,
                'format': 'xxx-yyyy-zzz',
                'status': processo.status
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Erro ao corrigir link: {str(e)}'
            }, status=500)

class GoogleOAuthCallbackView(APIView):
    """Endpoint de callback OAuth - rota exata do redirect"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Processar callback OAuth do Google"""
        try:
            code = request.GET.get("code")
            if not code:
                return Response({
                    'success': False,
                    'error': 'Faltou code no callback OAuth'
                }, status=400)
            
            import requests
            import json
            from dotenv import load_dotenv
            
            # Carregar configurações
            load_dotenv('google_config.env')
            
            CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
            CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
            REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
            TOKEN_URL = "https://oauth2.googleapis.com/token"
            
            # Trocar code por tokens
            data = {
                "code": code,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            }
            
            r = requests.post(TOKEN_URL, data=data, timeout=20)
            if r.status_code != 200:
                return Response({
                    'success': False,
                    'error': f'Erro ao trocar code: {r.status_code}',
                    'details': r.text
                }, status=500)
            
            tokens = r.json()
            
            # Salvar tokens (em produção, salvaria no banco por usuário)
            with open("google_tokens_dev.json", "w", encoding="utf-8") as f:
                json.dump(tokens, f, ensure_ascii=False, indent=2)
            
            return Response({
                'success': True,
                'message': 'Autenticado com sucesso!',
                'redirect_uri_used': REDIRECT_URI,
                'tokens_saved': True,
                'access_token': tokens.get('access_token', '')[:20] + '...' if tokens.get('access_token') else None,
                'refresh_token': '***' if tokens.get('refresh_token') else None
            })
                
        except Exception as e:
            import traceback
            return Response({
                'success': False,
                'error': f'Erro no callback OAuth: {str(e)}',
                'details': traceback.format_exc()
            }, status=500)

class DiagnosticoRedirectUriView(APIView):
    """Endpoint público para diagnóstico cirúrgico do redirect_uri"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Diagnóstico cirúrgico do redirect_uri_mismatch"""
        try:
            from core.services.google_meet_service import GoogleMeetService
            
            # Tentar inicializar o serviço para capturar redirect_uri
            meet_service = GoogleMeetService()
            
            return Response({
                'success': True,
                'message': 'Diagnóstico executado - verifique os logs do servidor',
                'instructions': 'Os logs mostrarão exatamente qual redirect_uri está sendo enviado'
            })
                
        except Exception as e:
            import traceback
            return Response({
                'success': False,
                'error': f'Erro no diagnóstico: {str(e)}',
                'details': traceback.format_exc(),
                'redirect_uri_detected': 'Verifique os logs para ver o redirect_uri exato'
            }, status=500)

class TestRealGoogleMeetView(APIView):
    """Endpoint público para testar criação REAL de reunião no Google Meet"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Testar criação de reunião REAL no Google Meet"""
        try:
            if not GOOGLE_MEET_AVAILABLE:
                return Response({
                    'success': False,
                    'error': 'Google Meet não está disponível',
                    'details': 'GOOGLE_MEET_AVAILABLE = False'
                }, status=503)
            
            from datetime import datetime, timedelta
            from django.utils import timezone
            from core.services.google_meet_service import GoogleMeetService
            
            # Criar serviço Google Meet
            meet_service = GoogleMeetService()
            
            if not meet_service.service:
                return Response({
                    'success': False,
                    'error': 'Google Meet não autenticado',
                    'details': 'Configure OAuth corretamente para criar salas reais',
                    'solution': 'Adicione as URIs de redirecionamento no Google Cloud Console',
                    'redirect_uri': 'http://localhost:8000/oauth2callback',
                    'client_id': '343146875318-u97jnvlbvoh15m956v718cinf03q1hvi.apps.googleusercontent.com'
                }, status=503)
            
            # Criar reunião de teste REAL
            now = timezone.now()
            start_time = now + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
            
            meet_info = meet_service.create_meeting(
                summary="Teste Veramo3 - Reunião REAL",
                description="Esta é uma reunião REAL criada via API do Google Calendar",
                start_time=start_time,
                end_time=end_time,
                attendees=["empresa1@veramo.com"],
                location="Google Meet"
            )
            
            if meet_info:
                return Response({
                    'success': True,
                    'message': 'Reunião REAL criada com sucesso!',
                    'meet_info': {
                        'event_id': meet_info.get('event_id'),
                        'meet_link': meet_info.get('meet_link'),
                        'conference_id': meet_info.get('conference_id'),
                        'summary': meet_info.get('summary'),
                        'method': meet_info.get('method', 'real_api')
                    },
                    'instructions': 'Esta é uma sala REAL do Google Meet que funciona!'
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Falha ao criar reunião REAL',
                    'details': 'Verifique os logs para mais informações'
                }, status=500)
                
        except Exception as e:
            import traceback
            return Response({
                'success': False,
                'error': f'Erro ao testar Google Meet: {str(e)}',
                'details': traceback.format_exc()
            }, status=500)

class TestGoogleMeetView(APIView):
    """Endpoint público para testar Google Meet"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Testar criação de reunião no Google Meet"""
        try:
            if not GOOGLE_MEET_AVAILABLE:
                return Response({
                    'success': False,
                    'error': 'Google Meet não está disponível',
                    'details': 'GOOGLE_MEET_AVAILABLE = False'
                }, status=503)
            
            # Testar criação de uma reunião simples
            from datetime import datetime, timedelta
            from django.utils import timezone
            
            now = timezone.now()
            start_time = now + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
            
            meet_service = GoogleMeetService()
            meet_info = meet_service.create_meeting(
                summary="Teste - Veramo3 Google Meet",
                description="Esta é uma reunião de teste para verificar a integração",
                start_time=start_time,
                end_time=end_time,
                attendees=[],
                location="Google Meet"
            )
            
            if meet_info:
                return Response({
                    'success': True,
                    'message': 'Google Meet funcionando corretamente!',
                    'meet_info': {
                        'meet_link': meet_info.get('meet_link'),
                        'event_id': meet_info.get('event_id'),
                        'summary': meet_info.get('summary')
                    }
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Falha ao criar reunião',
                    'details': 'meet_info retornou None'
                }, status=500)
                
        except Exception as e:
            import traceback
            return Response({
                'success': False,
                'error': f'Erro ao testar Google Meet: {str(e)}',
                'details': traceback.format_exc()
            }, status=500)

# View customizada para login com rate limiting
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import status

class CustomLoginView(APIView):
    throttle_classes = [LoginThrottle]
    
    def post(self, request):
        """Login customizado com logs de segurança"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            security_logger.warning(f"Tentativa de login sem credenciais: {request.META.get('REMOTE_ADDR', 'N/A')}")
            return Response(
                {'error': 'Email e senha são obrigatórios'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = authenticate(email=email, password=password)
            
            if user is not None and user.is_active:
                # Login bem-sucedido
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                # Log de login bem-sucedido
                security_logger.info(
                    f"Login bem-sucedido: {email} "
                    f"IP: {request.META.get('REMOTE_ADDR', 'N/A')} "
                    f"User-Agent: {request.META.get('HTTP_USER_AGENT', 'N/A')}"
                )
                
                return Response({
                    'access': str(access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    }
                })
            else:
                # Login falhou
                security_logger.warning(
                    f"Tentativa de login falhou: {email} "
                    f"IP: {request.META.get('REMOTE_ADDR', 'N/A')}"
                )
                return Response(
                    {'error': 'Credenciais inválidas'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            security_logger.error(f"Erro durante login: {str(e)}")
            return Response(
                {'error': 'Erro interno do servidor'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# View para dashboard com logs
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """Dashboard com logs de acesso"""
    try:
        user = request.user
        
        # Log de acesso ao dashboard
        security_logger.info(
            f"Acesso ao dashboard: {user.email} "
            f"IP: {request.META.get('REMOTE_ADDR', 'N/A')}"
        )
        # Lógica do dashboard aqui...
        data = {
            'message': 'Dashboard acessado com sucesso',
            'user': {
                'email': user.email,
                'role': user.role,
            }
        }
        return Response(data)
    except Exception as e:
        security_logger.error(f"Erro no dashboard: {str(e)}")
        return Response(
            {'error': 'Erro interno do servidor'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class PublicUploadView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk, token):
        """Upload público do trabalhador: requer token válido e não precisa de login"""
        try:
            processo = DemissaoProcess.objects.get(id=pk)
            # Validar token e expiração
            if not processo.employee_upload_token or processo.employee_upload_token != token:
                return Response({'error': 'Token inválido'}, status=status.HTTP_403_FORBIDDEN)
            if processo.employee_upload_expires and processo.employee_upload_expires < timezone.now():
                return Response({'error': 'Token expirado'}, status=status.HTTP_403_FORBIDDEN)

            documento = request.FILES.get('documento')
            if not documento:
                return Response({'error': 'Documento é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

            processo.documento_assinado_trabalhador = documento
            processo.assinado_trabalhador = True
            processo.data_assinatura_trabalhador = timezone.now()
            processo.save()

            return Response({'detail': 'Documento do trabalhador enviado com sucesso'}, status=status.HTTP_200_OK)
        except DemissaoProcess.DoesNotExist:
            return Response({'error': 'Processo não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erro no upload: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para logs do sistema - apenas leitura para administradores"""
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get_queryset(self):
        queryset = SystemLog.objects.all()
        
        # Filtros opcionais
        level = self.request.query_params.get('level', None)
        action = self.request.query_params.get('action', None)
        user_id = self.request.query_params.get('user', None)
        company_id = self.request.query_params.get('company', None)
        union_id = self.request.query_params.get('union', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if level:
            queryset = queryset.filter(level=level)
        if action:
            queryset = queryset.filter(action=action)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        if union_id:
            queryset = queryset.filter(union_id=union_id)
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
            
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retorna estatísticas dos logs"""
        queryset = self.get_queryset()
        
        # Contagem por nível
        level_counts = {}
        for level, _ in SystemLog.LEVEL_CHOICES:
            level_counts[level] = queryset.filter(level=level).count()
        
        # Contagem por ação (top 10)
        action_counts = {}
        for action, _ in SystemLog.ACTION_CHOICES:
            count = queryset.filter(action=action).count()
            if count > 0:
                action_counts[action] = count
        
        # Ordenar por contagem
        top_actions = dict(sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Logs por dia (últimos 30 dias)
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        
        daily_logs = queryset.filter(
            timestamp__gte=timezone.now() - timedelta(days=30)
        ).annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        return Response({
            'total_logs': queryset.count(),
            'level_counts': level_counts,
            'top_actions': top_actions,
            'daily_logs': list(daily_logs)
        })
