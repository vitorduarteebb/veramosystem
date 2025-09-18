from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.db import transaction
from .models import SigningSession, Party, EvidenceEvent
from .serializers import (
    SigningSessionSerializer, EvidenceEventSerializer, CreateSessionSerializer,
    SetPartiesSerializer, SendOtpSerializer, VerifyAndSignSerializer
)
from .utils import (
    sha256_file, jws_sign, stamp_signature_block, generate_otp, hash_otp,
    verify_otp, generate_magic_token, hash_magic_token, verify_magic_token
)
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class IsUnionOrCompany(permissions.BasePermission):
    """Permissão para usuários do sindicato ou empresa"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class SigningSessionViewSet(viewsets.ViewSet):
    permission_classes = [IsUnionOrCompany]

    @action(detail=False, methods=['post'])
    def create_session(self, request):
        """Cria uma nova sessão de assinatura com upload do PDF"""
        serializer = CreateSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                pdf = serializer.validated_data['pdf']
                schedule_id = serializer.validated_data.get('schedule_id')
                
                # Criar sessão
                session = SigningSession.objects.create(
                    created_by=request.user,
                    pdf_original=pdf,
                    schedule_id=schedule_id
                )
                
                # Calcular hash do PDF original
                session.hash_original = sha256_file(session.pdf_original.path)
                session.save()
                
                # Registrar evento
                EvidenceEvent.objects.create(
                    session=session,
                    type="PDF_UPLOADED",
                    timestamp_local=timezone.localtime(),
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    payload={"hash_original": session.hash_original}
                )
                
                logger.info(f"Sessão de assinatura criada: {session.id}")
                return Response({"session_id": str(session.id)}, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Erro ao criar sessão de assinatura: {str(e)}")
            return Response(
                {"error": f"Erro ao criar sessão: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def set_parties(self, request, pk=None):
        """Define as partes envolvidas na assinatura"""
        session = get_object_or_404(SigningSession, pk=pk)
        serializer = SetPartiesSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Remover partes existentes
                session.parties.all().delete()
                
                # Criar novas partes
                for role, data in serializer.validated_data.items():
                    Party.objects.create(
                        session=session,
                        role=role.upper(),
                        name=data['name'],
                        cpf=data['cpf'],
                        email=data['email'],
                        phone=data.get('phone', '')
                    )
                
                # Registrar evento
                EvidenceEvent.objects.create(
                    session=session,
                    type="PARTIES_DEFINED",
                    timestamp_local=timezone.localtime(),
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    payload={"parties_count": len(serializer.validated_data)}
                )
                
                return Response({"ok": True})
                
        except Exception as e:
            logger.error(f"Erro ao definir partes: {str(e)}")
            return Response(
                {"error": f"Erro ao definir partes: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def gen_employee_link(self, request, pk=None):
        """Gera link temporário para o funcionário assinar"""
        session = get_object_or_404(SigningSession, pk=pk)
        
        try:
            with transaction.atomic():
                employee = session.parties.get(role='EMPLOYEE')
                token = generate_magic_token()
                
                employee.magic_link_token = hash_magic_token(token)
                employee.magic_link_expires_at = timezone.now() + timedelta(
                    seconds=int(getattr(settings, 'MAGIC_LINK_TTL_SECONDS', 1800))
                )
                employee.save()
                
                # Registrar evento
                EvidenceEvent.objects.create(
                    session=session,
                    party=employee,
                    type="EMPLOYEE_LINK_GENERATED",
                    timestamp_local=timezone.localtime(),
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                # Gerar URL do link
                frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3001')
                url = f"{frontend_url}/assinaturas/convite/{token}?sid={session.id}"
                
                # TODO: Enviar email/SMS com o link
                logger.info(f"Link do funcionário gerado: {url}")
                
                return Response({"magic_link_url": url})
                
        except Exception as e:
            logger.error(f"Erro ao gerar link do funcionário: {str(e)}")
            return Response(
                {"error": f"Erro ao gerar link: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_otp(self, request, pk=None):
        """Envia OTP para uma das partes"""
        session = get_object_or_404(SigningSession, pk=pk)
        serializer = SendOtpSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            role = serializer.validated_data['role']
            party = session.parties.get(role=role)
            
            # Gerar OTP
            otp = generate_otp()
            party.otp_hash = hash_otp(otp)
            party.otp_expires_at = timezone.now() + timedelta(
                seconds=int(getattr(settings, 'OTP_TTL_SECONDS', 300))
            )
            party.save()
            
            # Registrar evento
            EvidenceEvent.objects.create(
                session=session,
                party=party,
                type="OTP_SENT",
                timestamp_local=timezone.localtime(),
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # TODO: Enviar OTP por email/SMS
            logger.info(f"OTP enviado para {role}: {otp}")
            
            return Response({"ok": True})
            
        except Exception as e:
            logger.error(f"Erro ao enviar OTP: {str(e)}")
            return Response(
                {"error": f"Erro ao enviar OTP: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def verify_and_sign(self, request, pk=None):
        """Verifica OTP e registra assinatura"""
        session = get_object_or_404(SigningSession, pk=pk)
        serializer = VerifyAndSignSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                role = serializer.validated_data['role']
                party = session.parties.get(role=role)
                otp = serializer.validated_data['otp']
                consent = serializer.validated_data['consent']
                token = serializer.validated_data.get('token', '')
                
                # Validar consentimento
                if not consent:
                    return Response({"error": "Consentimento é obrigatório"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Validar magic link para EMPLOYEE
                if role == "EMPLOYEE":
                    if not token or not verify_magic_token(token, party.magic_link_token):
                        return Response({"error": "Link inválido"}, status=status.HTTP_403_FORBIDDEN)
                    
                    if not party.magic_link_expires_at or party.magic_link_expires_at < timezone.now():
                        return Response({"error": "Link expirado"}, status=status.HTTP_403_FORBIDDEN)
                
                # Validar OTP
                if not party.otp_expires_at or party.otp_expires_at < timezone.now():
                    return Response({"error": "OTP expirado"}, status=status.HTTP_400_BAD_REQUEST)
                
                if not verify_otp(otp, party.otp_hash):
                    return Response({"error": "OTP inválido"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Registrar assinatura
                ip = request.META.get('REMOTE_ADDR')
                ua = request.META.get('HTTP_USER_AGENT', '')
                
                party.signed_at = timezone.now()
                party.signed_ip = ip
                party.signed_user_agent = ua
                party.otp_hash = ""
                party.otp_expires_at = None
                
                if role == "EMPLOYEE":
                    party.magic_link_token = ""
                    party.magic_link_expires_at = None
                
                party.save()
                
                # Registrar eventos
                EvidenceEvent.objects.create(
                    session=session,
                    party=party,
                    type="CONSENT_GIVEN",
                    timestamp_local=timezone.localtime(),
                    ip=ip,
                    user_agent=ua,
                    payload={"consent": True}
                )
                
                EvidenceEvent.objects.create(
                    session=session,
                    party=party,
                    type="SIGNED",
                    timestamp_local=timezone.localtime(),
                    ip=ip,
                    user_agent=ua,
                    payload={"cpf": party.cpf, "name": party.name}
                )
                
                # Verificar se todos assinaram
                all_signed = session.parties.filter(signed_at__isnull=True).count() == 0
                
                if all_signed and not session.is_completed:
                    # Gerar PDF final com assinaturas
                    self._finalize_session(session)
                
                return Response({"ok": True, "all_signed": session.is_completed})
                
        except Exception as e:
            logger.error(f"Erro ao verificar e assinar: {str(e)}")
            return Response(
                {"error": f"Erro ao assinar: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _finalize_session(self, session):
        """Finaliza a sessão gerando PDF com assinaturas"""
        try:
            # Preparar blocos de assinatura
            blocks = []
            for party in session.parties.all().order_by('role'):
                lines = [
                    f"Assinado por: {party.name}  CPF: {party.cpf}",
                    f"Data/Hora: {timezone.localtime(party.signed_at).strftime('%Y-%m-%d %H:%M:%S %Z')}",
                    f"IP: {party.signed_ip}  UA: {party.signed_user_agent[:120]}",
                    f"Hash base (SHA-256): {session.hash_original[:16]}..."
                ]
                
                y_pos = 140 if party.role == 'COMPANY' else (100 if party.role == 'UNION' else 60)
                blocks.append({
                    "x": 40,
                    "y": y_pos,
                    "text_lines": lines,
                    "page_index": -1
                })
            
            # Estampar assinaturas no PDF
            out_path = session.pdf_original.storage.path(f"signing/signed/{session.id}.pdf")
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            
            if stamp_signature_block(session.pdf_original.path, out_path, blocks):
                session.pdf_final.name = f"signing/signed/{session.id}.pdf"
                session.hash_final = sha256_file(out_path)
                
                # Criar selo JWS
                payload = {
                    "session": str(session.id),
                    "hash_original": session.hash_original,
                    "hash_final": session.hash_final,
                    "signed_parties": [
                        {"role": p.role, "cpf": p.cpf, "at": p.signed_at.isoformat()} 
                        for p in session.parties.all()
                    ],
                    "issued_at": int(time.time())
                }
                seal = jws_sign(payload)
                
                EvidenceEvent.objects.create(
                    session=session,
                    type="FINAL_SEAL",
                    payload={"jws": seal},
                    timestamp_local=timezone.localtime()
                )
                
                session.is_completed = True
                session.completed_at = timezone.now()
                session.save()
                
                EvidenceEvent.objects.create(
                    session=session,
                    type="FINALIZED",
                    timestamp_local=timezone.localtime()
                )
                
                logger.info(f"Sessão finalizada: {session.id}")
            else:
                logger.error(f"Erro ao estampar PDF para sessão {session.id}")
                
        except Exception as e:
            logger.error(f"Erro ao finalizar sessão {session.id}: {str(e)}")

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download do PDF final assinado"""
        session = get_object_or_404(SigningSession, pk=pk)
        
        if not session.is_completed or not session.pdf_final:
            return Response({"error": "Sessão ainda não finalizada"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            return FileResponse(
                open(session.pdf_final.path, 'rb'),
                as_attachment=True,
                filename=f"assinatura_{session.id}.pdf"
            )
        except Exception as e:
            logger.error(f"Erro ao fazer download: {str(e)}")
            return Response({"error": "Erro ao fazer download"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def evidence(self, request, pk=None):
        """Relatório de evidências da sessão"""
        session = get_object_or_404(SigningSession, pk=pk)
        
        events = EvidenceEvent.objects.filter(session=session).order_by('timestamp_utc')
        events_data = EvidenceEventSerializer(events, many=True).data
        
        return Response({
            "session": str(session.id),
            "hash_original": session.hash_original,
            "hash_final": session.hash_final,
            "is_completed": session.is_completed,
            "events": events_data
        })

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Status atual da sessão"""
        session = get_object_or_404(SigningSession, pk=pk)
        parties_data = []
        
        for party in session.parties.all():
            parties_data.append({
                "role": party.role,
                "name": party.name,
                "signed": party.signed_at is not None,
                "signed_at": party.signed_at.isoformat() if party.signed_at else None
            })
        
        return Response({
            "session_id": str(session.id),
            "is_completed": session.is_completed,
            "parties": parties_data,
            "created_at": session.created_at.isoformat(),
            "completed_at": session.completed_at.isoformat() if session.completed_at else None
        })
