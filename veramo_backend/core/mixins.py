"""
Mixins para ViewSets do Veramo3
Funcionalidades reutilizáveis para controle de acesso
"""
from rest_framework import mixins
from django.db.models import Q
from django.utils import timezone

class OrgScopedQuerysetMixin:
    """
    Mixin para filtrar queryset por organização do usuário
    Garante que usuários só vejam dados da sua empresa/sindicato
    """
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Superadmin pode ver tudo
        if getattr(user, "is_superuser", False) or user.role in ['admin', 'superadmin']:
            return qs
        
        # Usuário da empresa
        if getattr(user, "company_id", None):
            return qs.filter(company_id=user.company_id)
        
        # Usuário do sindicato
        if getattr(user, "union_id", None):
            return qs.filter(union_id=user.union_id)
        
        # Usuário com owner_id (documentos pessoais)
        if hasattr(qs.model, "owner_id"):
            return qs.filter(owner_id=user.id)
        
        # Se não tem nenhuma relação, retorna vazio
        return qs.none()

class UserScopedQuerysetMixin:
    """
    Mixin para filtrar queryset por usuário específico
    Útil para dados pessoais do usuário
    """
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Superadmin pode ver tudo
        if getattr(user, "is_superuser", False) or user.role in ['admin', 'superadmin']:
            return qs
        
        # Filtrar por usuário
        if hasattr(qs.model, "user_id"):
            return qs.filter(user_id=user.id)
        elif hasattr(qs.model, "owner_id"):
            return qs.filter(owner_id=user.id)
        
        return qs.none()

class ReadOnlyIfNotOwnerMixin:
    """
    Mixin para permitir apenas leitura se não for o dono
    Útil para dados que só podem ser editados pelo proprietário
    """
    
    def get_permissions(self):
        permissions = super().get_permissions()
        
        # Se não for o dono, só permite leitura
        if self.action in ['update', 'partial_update', 'destroy']:
            obj = self.get_object()
            if hasattr(obj, 'user_id') and obj.user_id != self.request.user.id:
                from rest_framework.permissions import IsAuthenticated
                permissions = [IsAuthenticated()]
        
        return permissions

class AuditFieldsMixin:
    """
    Mixin para adicionar campos de auditoria automaticamente
    """
    
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            created_at=timezone.now()
        )
    
    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user,
            updated_at=timezone.now()
        )
