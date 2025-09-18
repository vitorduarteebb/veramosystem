"""
Views para servir mídia de forma segura
Verifica permissões antes de servir arquivos
"""
from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models.document import Document
from .models.demissao_process import DemissaoProcess
import os
import logging

logger = logging.getLogger('core.security')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def secure_document(request, pk):
    """
    Serve documento de forma segura
    Verifica se o usuário tem permissão para acessar
    """
    try:
        doc = get_object_or_404(Document, pk=pk)
        
        # Verificar permissões
        user = request.user
        
        # Superadmin pode acessar tudo
        if user.role in ['admin', 'superadmin']:
            pass
        # Usuário da empresa só pode acessar documentos da sua empresa
        elif user.role in ['company_master', 'company_common'] and user.company:
            if doc.employee and doc.employee.company != user.company:
                logger.warning(f"Tentativa de acesso não autorizado ao documento {pk} por {user.email}")
                raise Http404()
            if doc.demissao_process and doc.demissao_process.empresa != user.company:
                logger.warning(f"Tentativa de acesso não autorizado ao documento {pk} por {user.email}")
                raise Http404()
        # Usuário do sindicato só pode acessar documentos do seu sindicato
        elif user.role in ['union_master', 'union_common'] and user.union:
            if doc.employee and doc.employee.union != user.union:
                logger.warning(f"Tentativa de acesso não autorizado ao documento {pk} por {user.email}")
                raise Http404()
            if doc.demissao_process and doc.demissao_process.sindicato != user.union:
                logger.warning(f"Tentativa de acesso não autorizado ao documento {pk} por {user.email}")
                raise Http404()
        else:
            logger.warning(f"Usuário sem role válido tentando acessar documento {pk}: {user.email}")
            raise Http404()
        
        # Log de acesso bem-sucedido
        logger.info(f"Documento {pk} acessado por {user.email}")
        
        # Em produção: X-Accel-Redirect via Nginx; em desenvolvimento: FileResponse direto
        if not settings.DEBUG:
            response = HttpResponse()
            response["X-Accel-Redirect"] = f"/protected/{doc.file.name}"
            response["Content-Type"] = ""
            response["Content-Disposition"] = f"inline; filename={os.path.basename(doc.file.name)}"
            return response
        else:
            # Fallback local
            doc.file.open('rb')
            return FileResponse(doc.file, as_attachment=False, filename=os.path.basename(doc.file.name))
        
    except Exception as e:
        logger.error(f"Erro ao servir documento {pk}: {str(e)}")
        raise Http404()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def secure_assinatura(request, pk, tipo):
    """
    Serve documento de assinatura de forma segura
    tipo: 'empresa' ou 'sindicato'
    """
    try:
        processo = get_object_or_404(DemissaoProcess, pk=pk)
        user = request.user
        
        # Verificar permissões
        if user.role in ['admin', 'superadmin']:
            pass
        elif user.role in ['company_master', 'company_common'] and user.company:
            if processo.empresa != user.company:
                logger.warning(f"Tentativa de acesso não autorizado à assinatura {pk} por {user.email}")
                raise Http404()
        elif user.role in ['union_master', 'union_common'] and user.union:
            if processo.sindicato != user.union:
                logger.warning(f"Tentativa de acesso não autorizado à assinatura {pk} por {user.email}")
                raise Http404()
        else:
            raise Http404()
        
        # Determinar qual arquivo servir
        if tipo == 'empresa' and processo.documento_assinado_empresa:
            arquivo = processo.documento_assinado_empresa
        elif tipo == 'sindicato' and processo.documento_assinado_sindicato:
            arquivo = processo.documento_assinado_sindicato
        else:
            raise Http404()
        
        # Log de acesso
        logger.info(f"Assinatura {tipo} do processo {pk} acessada por {user.email}")
        
        # Em produção: X-Accel-Redirect via Nginx; em desenvolvimento: FileResponse direto
        if not settings.DEBUG:
            response = HttpResponse()
            response["X-Accel-Redirect"] = f"/protected/{arquivo.name}"
            response["Content-Type"] = ""
            response["Content-Disposition"] = f"inline; filename={os.path.basename(arquivo.name)}"
            return response
        else:
            arquivo.open('rb')
            return FileResponse(arquivo, as_attachment=False, filename=os.path.basename(arquivo.name))
        
    except Exception as e:
        logger.error(f"Erro ao servir assinatura {pk} {tipo}: {str(e)}")
        raise Http404()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def secure_media_info(request, pk):
    """
    Retorna informações do arquivo sem servir o conteúdo
    Útil para verificar permissões antes de fazer download
    """
    try:
        doc = get_object_or_404(Document, pk=pk)
        user = request.user
        
        # Verificar permissões (mesma lógica do secure_document)
        if user.role in ['admin', 'superadmin']:
            pass
        elif user.role in ['company_master', 'company_common'] and user.company:
            if doc.employee and doc.employee.company != user.company:
                raise Http404()
            if doc.demissao_process and doc.demissao_process.empresa != user.company:
                raise Http404()
        elif user.role in ['union_master', 'union_common'] and user.union:
            if doc.employee and doc.employee.union != user.union:
                raise Http404()
            if doc.demissao_process and doc.demissao_process.sindicato != user.union:
                raise Http404()
        else:
            raise Http404()
        
        # Retornar informações do arquivo
        return Response({
            'id': doc.id,
            'filename': os.path.basename(doc.file.name),
            'size': doc.file.size,
            'type': doc.type,
            'status': doc.status,
            'uploaded_at': doc.uploaded_at,
            'download_url': f'/api/secure-media/document/{doc.id}/'
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter info do documento {pk}: {str(e)}")
        return Response(
            {'error': 'Documento não encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )
