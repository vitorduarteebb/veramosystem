from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role in ['admin', 'superadmin']

class IsCompanyMaster(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'company_master'

class IsSuperAdminOrCompanyMaster(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and (
            request.user.role in ['admin', 'superadmin'] or request.user.role == 'company_master'
        )

class IsUnionMasterOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.role in ['union_master', 'admin', 'superadmin'])

class IsSuperAdminOrCompanyMasterOrUnionMaster(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and (
            request.user.role in ['admin', 'superadmin'] or request.user.role == 'company_master' or request.user.role == 'union_master'
        )

class IsSameOrg(BasePermission):
    """
    Permissão por objeto - verifica se o usuário pertence à mesma organização
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Superadmin pode acessar tudo
        if user.role in ['admin', 'superadmin']:
            return True
            
        # Verificar se o objeto tem empresa
        if hasattr(obj, 'company') and obj.company:
            if user.company_id and obj.company_id == user.company_id:
                return True
                
        # Verificar se o objeto tem sindicato
        if hasattr(obj, 'union') and obj.union:
            if user.union_id and obj.union_id == user.union_id:
                return True
                
        # Verificar se o objeto tem employee com empresa/sindicato
        if hasattr(obj, 'employee') and obj.employee:
            if user.company_id and obj.employee.company_id == user.company_id:
                return True
            if user.union_id and obj.employee.union_id == user.union_id:
                return True
                
        # Verificar se o objeto tem demissao_process com empresa/sindicato
        if hasattr(obj, 'demissao_process') and obj.demissao_process:
            if user.company_id and obj.demissao_process.empresa_id == user.company_id:
                return True
            if user.union_id and obj.demissao_process.sindicato_id == user.union_id:
                return True
        
        return False

class IsOwnerOrSameOrg(BasePermission):
    """
    Permissão por objeto - verifica se é o dono ou da mesma organização
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Superadmin pode acessar tudo
        if user.role in ['admin', 'superadmin']:
            return True
            
        # Verificar se é o dono do objeto
        if hasattr(obj, 'user') and obj.user_id == user.id:
            return True
            
        # Verificar se é da mesma organização
        return IsSameOrg().has_object_permission(request, view, obj) 