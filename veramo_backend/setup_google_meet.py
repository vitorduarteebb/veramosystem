#!/usr/bin/env python3
"""
Script de configuração automática para integração com Google Meet
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def print_header():
    """Imprime cabeçalho do script"""
    print("=" * 60)
    print("🔧 CONFIGURAÇÃO AUTOMÁTICA - GOOGLE MEET INTEGRATION")
    print("=" * 60)
    print()

def check_python_version():
    """Verifica a versão do Python"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ é necessário")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detectado")

def check_django_project():
    """Verifica se estamos em um projeto Django"""
    if not os.path.exists('manage.py'):
        print("❌ Arquivo manage.py não encontrado. Execute este script na raiz do projeto Django.")
        sys.exit(1)
    print("✅ Projeto Django detectado")

def install_dependencies():
    """Instala as dependências necessárias"""
    print("\n📦 Instalando dependências do Google Meet...")
    
    dependencies = [
        'google-auth>=2.23.0',
        'google-auth-oauthlib>=1.1.0',
        'google-auth-httplib2>=0.1.1',
        'google-api-python-client>=2.100.0',
        'google-cloud-pubsub>=2.18.0'
    ]
    
    for dep in dependencies:
        try:
            print(f"  Instalando {dep}...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', dep], 
                         check=True, capture_output=True)
            print(f"  ✅ {dep} instalado")
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Erro ao instalar {dep}: {e}")
            return False
    
    return True

def create_directories():
    """Cria diretórios necessários"""
    print("\n📁 Criando diretórios...")
    
    directories = [
        'core/services',
        'core/management/commands',
        'core/settings'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"  ✅ Diretório {directory} criado/verificado")

def create_init_files():
    """Cria arquivos __init__.py necessários"""
    print("\n📄 Criando arquivos __init__.py...")
    
    init_files = [
        'core/services/__init__.py',
        'core/management/__init__.py',
        'core/management/commands/__init__.py',
        'core/settings/__init__.py'
    ]
    
    for init_file in init_files:
        Path(init_file).touch(exist_ok=True)
        print(f"  ✅ {init_file} criado/verificado")

def check_existing_files():
    """Verifica se os arquivos já existem"""
    print("\n🔍 Verificando arquivos existentes...")
    
    files_to_check = [
        'core/services/google_meet_service.py',
        'core/settings/google_meet.py',
        'core/management/commands/test_google_meet.py',
        'env.google_meet.example',
        'README_GOOGLE_MEET.md'
    ]
    
    existing_files = []
    for file_path in files_to_check:
        if os.path.exists(file_path):
            existing_files.append(file_path)
            print(f"  ⚠️  {file_path} já existe")
        else:
            print(f"  ✅ {file_path} não existe (será criado)")
    
    if existing_files:
        print(f"\n⚠️  {len(existing_files)} arquivo(s) já existem")
        overwrite = input("Deseja sobrescrever? (s/N): ").lower()
        if overwrite not in ['s', 'sim', 'y', 'yes']:
            print("❌ Configuração cancelada")
            sys.exit(0)

def run_migrations():
    """Executa as migrações do Django"""
    print("\n🔄 Executando migrações...")
    
    try:
        # Verificar se há migrações pendentes
        result = subprocess.run([sys.executable, 'manage.py', 'makemigrations'], 
                              capture_output=True, text=True)
        
        if "No changes detected" in result.stdout:
            print("  ✅ Nenhuma migração pendente")
        else:
            print("  📝 Migrações criadas")
            
            # Executar migrações
            subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
            print("  ✅ Migrações aplicadas")
            
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Erro ao executar migrações: {e}")
        return False
    
    return True

def create_env_file():
    """Cria arquivo .env com configurações básicas"""
    print("\n🔐 Criando arquivo .env...")
    
    env_content = """# Configurações do Google Meet
# Copie este arquivo para .env e preencha com suas credenciais

# Opção 1: Arquivo de credenciais JSON
GOOGLE_CREDENTIALS_FILE=/path/to/your/service-account-key.json

# Opção 2: Credenciais em variável de ambiente
# GOOGLE_SERVICE_ACCOUNT_INFO={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# ID do projeto no Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Email da conta de serviço
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Fuso horário padrão
GOOGLE_MEET_TIMEZONE=America/Sao_Paulo

# Duração padrão da reunião em minutos
GOOGLE_MEET_DEFAULT_DURATION=60
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("  ✅ Arquivo .env criado")
    print("  📝 Edite o arquivo .env com suas credenciais")

def test_configuration():
    """Testa a configuração básica"""
    print("\n🧪 Testando configuração...")
    
    try:
        # Testar importação do serviço
        result = subprocess.run([sys.executable, 'manage.py', 'test_google_meet', '--check-config'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("  ✅ Configuração básica OK")
        else:
            print("  ⚠️  Configuração básica com problemas")
            print("  📝 Execute 'python manage.py test_google_meet --check-config' para mais detalhes")
            
    except Exception as e:
        print(f"  ❌ Erro ao testar configuração: {e}")

def print_next_steps():
    """Imprime próximos passos"""
    print("\n" + "=" * 60)
    print("🎉 CONFIGURAÇÃO CONCLUÍDA!")
    print("=" * 60)
    print()
    print("📋 PRÓXIMOS PASSOS:")
    print()
    print("1. 🔑 Configure suas credenciais do Google:")
    print("   - Acesse: https://console.cloud.google.com/")
    print("   - Crie um projeto e habilite as APIs necessárias")
    print("   - Crie uma conta de serviço com permissões adequadas")
    print("   - Baixe o arquivo de credenciais JSON")
    print()
    print("2. ⚙️  Configure as variáveis de ambiente:")
    print("   - Edite o arquivo .env com suas credenciais")
    print("   - Ou configure as variáveis no seu sistema")
    print()
    print("3. 🧪 Teste a configuração:")
    print("   python manage.py test_google_meet --check-config")
    print()
    print("4. 📚 Consulte a documentação:")
    print("   README_GOOGLE_MEET.md")
    print()
    print("5. 🚀 Crie uma reunião de teste:")
    print("   python manage.py test_google_meet --create-meeting")
    print()
    print("🔗 LINKS ÚTEIS:")
    print("   - Google Cloud Console: https://console.cloud.google.com/")
    print("   - Google Calendar API: https://developers.google.com/calendar")
    print("   - Google Meet API: https://developers.google.com/meet")
    print()
    print("📞 Para suporte, consulte o README_GOOGLE_MEET.md")

def main():
    """Função principal"""
    print_header()
    
    # Verificações iniciais
    check_python_version()
    check_django_project()
    
    # Instalação e configuração
    if not install_dependencies():
        print("❌ Falha na instalação das dependências")
        sys.exit(1)
    
    create_directories()
    create_init_files()
    check_existing_files()
    
    if not run_migrations():
        print("❌ Falha ao executar migrações")
        sys.exit(1)
    
    create_env_file()
    test_configuration()
    
    print_next_steps()

if __name__ == "__main__":
    main()
