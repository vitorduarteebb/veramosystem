from rest_framework import serializers
from .models import SigningSession, Party, EvidenceEvent

class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ['id', 'role', 'name', 'cpf', 'email', 'phone', 'signed_at', 'signed_ip']
        read_only_fields = ['id', 'signed_at', 'signed_ip']

class SigningSessionSerializer(serializers.ModelSerializer):
    parties = PartySerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = SigningSession
        fields = [
            'id', 'created_by', 'created_by_name', 'pdf_original', 'pdf_final',
            'hash_original', 'hash_final', 'is_completed', 'created_at', 'completed_at',
            'parties', 'schedule'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_by_name', 'pdf_final', 'hash_original',
            'hash_final', 'is_completed', 'created_at', 'completed_at'
        ]

class EvidenceEventSerializer(serializers.ModelSerializer):
    party_name = serializers.CharField(source='party.name', read_only=True)
    party_role = serializers.CharField(source='party.role', read_only=True)
    
    class Meta:
        model = EvidenceEvent
        fields = [
            'id', 'session', 'party', 'party_name', 'party_role', 'type',
            'timestamp_utc', 'timestamp_local', 'ip', 'user_agent', 'payload'
        ]
        read_only_fields = ['id', 'session']

class CreateSessionSerializer(serializers.Serializer):
    pdf = serializers.FileField()
    schedule_id = serializers.IntegerField(required=False)

class SetPartiesSerializer(serializers.Serializer):
    company = serializers.DictField()
    union = serializers.DictField()
    employee = serializers.DictField()

class SendOtpSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['COMPANY', 'UNION', 'EMPLOYEE'])

class VerifyAndSignSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['COMPANY', 'UNION', 'EMPLOYEE'])
    token = serializers.CharField(required=False)  # para EMPLOYEE
    otp = serializers.CharField(max_length=6, min_length=6)
    consent = serializers.BooleanField()
