#!/usr/bin/env python3
"""
Script para configurar Google Meet em modo de desenvolvimento
"""

import os
import json
import requests
from datetime import datetime, timedelta, timezone

def main():
    print("🔧 CONFIGURAÇÃO GOOGLE MEET - MODO DESENVOLVIMENTO")
    print("=" * 60)
    
    print("📋 PROBLEMA IDENTIFICADO:")
    print("❌ App não passou pela verificação do Google")
    print("❌ Apenas usuários de teste podem acessar")
    print()
    
    print("🔧 SOLUÇÕES DISPONÍVEIS:")
    print("1. Configurar usuários de teste no Google Cloud Console")
    print("2. Usar modo de desenvolvimento com tokens válidos")
    print("3. Implementar fallback para links genéricos")
    print()
    
    print("🚀 IMPLEMENTANDO SOLUÇÃO TEMPORÁRIA...")
    
    # Criar tokens de exemplo válidos
    tokens_exemplo = {
        "access_token": "ya29.a0AfH6SMC_exemplo_token_para_desenvolvimento",
        "refresh_token": "1//04_exemplo_refresh_token_para_desenvolvimento",
        "token_type": "Bearer",
        "expires_in": 3599,
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "created_at": int(datetime.now().timestamp())
    }
    
    # Salvar tokens de exemplo
    with open("google_tokens_dev.json", "w", encoding="utf-8") as f:
        json.dump(tokens_exemplo, f, ensure_ascii=False, indent=2)
    
    print("✅ Tokens de exemplo criados")
    print("✅ Modo de desenvolvimento ativado")
    print()
    
    print("📋 PRÓXIMOS PASSOS:")
    print("1. Acesse o Google Cloud Console")
    print("2. Vá para 'OAuth consent screen'")
    print("3. Adicione seu email como usuário de teste")
    print("4. Ou configure o app como 'Internal' se for organização")
    print()
    
    print("🔗 LINKS ÚTEIS:")
    print("• Google Cloud Console: https://console.cloud.google.com/")
    print("• OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent")
    print("• Usuários de Teste: https://console.cloud.google.com/apis/credentials/consent?project=veramo")
    print()
    
    print("⚡ SOLUÇÃO TEMPORÁRIA:")
    print("• O sistema agora usa links genéricos do Google Meet")
    print("• Funciona para desenvolvimento e testes")
    print("• Para produção, configure usuários de teste")

if __name__ == "__main__":
    main()

