from rest_framework import serializers
from .models.document import Document, DOCUMENT_TYPE_CHOICES
from .models.schedule import Schedule
from .models.company import Company
from .models.union import Union, CompanyUnion
from .models.user import User
from djoser.serializers import UserSerializer as BaseUserSerializer
from django.db import IntegrityError
import logging
from .models.config import ScheduleConfig
from .models.block import AgendaBlock
from .models.demissao_process import DemissaoProcess
from .models.log import SystemLog

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'employee', 'demissao_process', 'type', 'file', 'uploaded_at', 'status', 'motivo_recusa', 'rejeitado_em', 'aprovado_em']

# Para upload múltiplo
class MultiDocumentUploadSerializer(serializers.Serializer):
    employee = serializers.IntegerField()
    documents = serializers.ListField(
        child=serializers.FileField(),
        write_only=True
    )
    types = serializers.ListField(
        child=serializers.ChoiceField(choices=DOCUMENT_TYPE_CHOICES),
        write_only=True
    )

class ScheduleSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    homologador_nome = serializers.SerializerMethodField()
    homologador_email = serializers.CharField(source='union_user.email', read_only=True)
    
    def get_homologador_nome(self, obj):
        if obj.union_user:
            user = obj.union_user
            return f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
        return None
    
    class Meta:
        model = Schedule
        fields = '__all__'
        # Adiciona os campos extras para o frontend
        extra_fields = ['company_name', 'employee_name', 'homologador_nome', 'homologador_email']

class RessalvaSerializer(serializers.Serializer):
    ressalvas = serializers.CharField()

class AceiteSerializer(serializers.Serializer):
    aceite = serializers.BooleanField()
    cpf_assinatura = serializers.CharField()
    ip_assinatura = serializers.IPAddressField()
    data_aceite = serializers.DateTimeField()

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'cnpj']

class UnionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Union
        fields = ['id', 'name', 'cnpj']

class CompanyUnionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyUnion
        fields = ['id', 'company', 'union']

class UserSerializer(BaseUserSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=False)
    union = serializers.PrimaryKeyRelatedField(queryset=Union.objects.all(), required=False, allow_null=True)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    union_name = serializers.CharField(source='union.name', read_only=True)

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'role', 'union', 'company', 'company_name', 'union_name', 'password')

    def validate(self, data):
        role = data.get('role')
        union = data.get('union')
        company = data.get('company')
        # Sindical
        if role in ['union_master', 'union_common']:
            if not union:
                raise serializers.ValidationError('Usuários sindicais devem ter um sindicato (union) vinculado.')
            if company:
                raise serializers.ValidationError('Usuários sindicais não podem ter empresa (company) vinculada.')
        # Empresarial
        if role in ['company_master', 'company_common', 'employee']:
            if not company:
                raise serializers.ValidationError('Usuários empresariais devem ter uma empresa (company) vinculada.')
            if union:
                raise serializers.ValidationError('Usuários empresariais não podem ter sindicato (union) vinculado.')
        return data

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('O nome de usuário (username) é obrigatório.')
        username = value.strip()
        # Permite manter o mesmo username ao atualizar
        if self.instance and self.instance.username == username:
            return username
        if User.objects.filter(username=username).exclude(pk=getattr(self.instance, 'pk', None)).exists():
            raise serializers.ValidationError('Já existe um usuário com este nome de usuário.')
        return username

    def create(self, validated_data):
        # Garante que email e username sejam sempre iguais, limpos e minúsculos
        email = validated_data.get('email')
        if not email:
            raise serializers.ValidationError({'email': 'O campo email é obrigatório.'})
        email = email.strip().lower()
        validated_data['email'] = email
        validated_data['username'] = email
        password = validated_data.pop('password')
        try:
            user = super().create(validated_data)
            user.set_password(password)
            user.save()
            return user
        except IntegrityError as e:
            logging.error(f'Erro ao criar usuário: {e}')
            if 'unique' in str(e).lower() and 'email' in str(e).lower():
                raise serializers.ValidationError({'email': 'Já existe um usuário com este e-mail.'})
            if 'unique' in str(e).lower() and 'username' in str(e).lower():
                raise serializers.ValidationError({'username': 'Já existe um usuário com este nome de usuário.'})
            raise serializers.ValidationError('Erro ao criar usuário.')

    def update(self, instance, validated_data):
        # Normaliza email se enviado
        email = validated_data.get('email')
        if email:
            validated_data['email'] = email.strip().lower()
        # Ajusta username em edição: não força para email; mantém se não enviado
        if 'username' in validated_data and validated_data['username']:
            validated_data['username'] = validated_data['username'].strip()
        # Trata alteração de senha corretamente
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class ScheduleConfigSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.SerializerMethodField()
    usuario_id = serializers.IntegerField(source='union_user.id', read_only=True)
    union_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)
    
    def get_usuario_nome(self, obj):
        user = obj.union_user
        return f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
    
    class Meta:
        model = ScheduleConfig
        fields = ['id', 'usuario_id', 'usuario_nome', 'union_user', 'weekday', 'start_time', 'end_time', 'duration_minutes', 'break_minutes']

class AgendaBlockSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.SerializerMethodField()
    
    def get_usuario_nome(self, obj):
        user = obj.user
        return f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
    
    class Meta:
        model = AgendaBlock
        fields = ['id', 'union', 'user', 'usuario_nome', 'start', 'end', 'reason', 'is_holiday']

class DemissaoProcessSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    empresa_nome = serializers.CharField(source='empresa.name', read_only=True)
    sindicato_nome = serializers.CharField(source='sindicato.name', read_only=True)
    upload_public_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DemissaoProcess
        fields = '__all__'

    def get_upload_public_url(self, obj):
        try:
            from django.urls import reverse
            if obj.employee_upload_token:
                return reverse('public-upload', args=[obj.id, obj.employee_upload_token])
        except Exception:
            return None
        return None

class SystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField()
    user_name = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'timestamp', 'level', 'message', 'user', 'user_email', 'user_name',
            'action', 'ip_address', 'user_agent', 'company', 'union', 'schedule', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']