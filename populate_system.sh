#!/bin/bash

# Script para popular o sistema com dados de exemplo
# Execute na VPS como root

echo "🔧 Populando sistema com dados de exemplo..."

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }

# 2. Ativar ambiente virtual
source venv/bin/activate

# 3. Criar dados de exemplo via Django shell
echo "📊 Criando dados de exemplo..."
python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
from veramo_backend.simple_store import unions_store, companies_store, union_to_user_ids

User = get_user_model()

# Criar sindicatos de exemplo
print("🏢 Criando sindicatos...")
sindicatos = [
    {"nome": "Sindicato dos Metalúrgicos", "cnpj": "12.345.678/0001-90", "endereco": "Rua das Indústrias, 123"},
    {"nome": "Sindicato dos Comerciários", "cnpj": "98.765.432/0001-10", "endereco": "Av. Comercial, 456"},
    {"nome": "Sindicato dos Bancários", "cnpj": "11.222.333/0001-44", "endereco": "Rua Financeira, 789"}
]

for sindicato in sindicatos:
    created = unions_store.create(sindicato)
    print(f"✅ Sindicato criado: {created['nome']} (ID: {created['id']})")

# Criar empresas de exemplo
print("\n🏭 Criando empresas...")
empresas = [
    {"nome": "Metalúrgica ABC Ltda", "cnpj": "12.345.678/0001-01", "endereco": "Rua Industrial, 100"},
    {"nome": "Comércio XYZ S.A.", "cnpj": "98.765.432/0001-02", "endereco": "Av. Comercial, 200"},
    {"nome": "Banco Nacional", "cnpj": "11.222.333/0001-03", "endereco": "Rua Financeira, 300"}
]

for empresa in empresas:
    created = companies_store.create(empresa)
    print(f"✅ Empresa criada: {created['nome']} (ID: {created['id']})")

# Criar usuários de exemplo
print("\n👥 Criando usuários...")
usuarios = [
    {"username": "joao.silva", "email": "joao@metalurgicos.com", "password": "123456", "first_name": "João", "last_name": "Silva"},
    {"username": "maria.santos", "email": "maria@comerciarios.com", "password": "123456", "first_name": "Maria", "last_name": "Santos"},
    {"username": "pedro.oliveira", "email": "pedro@bancarios.com", "password": "123456", "first_name": "Pedro", "last_name": "Oliveira"},
    {"username": "ana.costa", "email": "ana@metalurgicos.com", "password": "123456", "first_name": "Ana", "last_name": "Costa"},
    {"username": "carlos.ferreira", "email": "carlos@comerciarios.com", "password": "123456", "first_name": "Carlos", "last_name": "Ferreira"},
    {"username": "lucia.mendes", "email": "lucia@bancarios.com", "password": "123456", "first_name": "Lúcia", "last_name": "Mendes"},
    {"username": "roberto.alves", "email": "roberto@metalurgicos.com", "password": "123456", "first_name": "Roberto", "last_name": "Alves"},
    {"username": "fernanda.lima", "email": "fernanda@comerciarios.com", "password": "123456", "first_name": "Fernanda", "last_name": "Lima"},
    {"username": "antonio.rodrigues", "email": "antonio@bancarios.com", "password": "123456", "first_name": "Antônio", "last_name": "Rodrigues"},
    {"username": "juliana.martins", "email": "juliana@metalurgicos.com", "password": "123456", "first_name": "Juliana", "last_name": "Martins"}
]

for i, usuario in enumerate(usuarios):
    user = User.objects.create_user(
        username=usuario["username"],
        email=usuario["email"],
        password=usuario["password"],
        first_name=usuario["first_name"],
        last_name=usuario["last_name"]
    )
    user.is_active = True
    user.save()
    
    # Associar usuário a um sindicato (distribuir entre os 3 sindicatos)
    sindicato_id = str((i % 3) + 1)  # IDs 1, 2, 3
    union_to_user_ids.setdefault(sindicato_id, []).append(user.id)
    
    print(f"✅ Usuário criado: {user.first_name} {user.last_name} ({user.email}) - Sindicato {sindicato_id}")

print(f"\n📊 Resumo dos dados criados:")
print(f"🏢 Sindicatos: {len(unions_store.list_all())}")
print(f"🏭 Empresas: {len(companies_store.list_all())}")
print(f"👥 Usuários: {User.objects.count()}")
print(f"🔗 Associações usuário-sindicato: {len(union_to_user_ids)}")

print("\n✅ Dados de exemplo criados com sucesso!")
EOF

# 4. Verificar se os dados foram criados
echo "🔍 Verificando dados criados..."
python manage.py shell -c "
from veramo_backend.simple_store import unions_store, companies_store, union_to_user_ids
from django.contrib.auth import get_user_model

User = get_user_model()

print('📊 Dados atuais:')
print(f'🏢 Sindicatos: {len(unions_store.list_all())}')
print(f'🏭 Empresas: {len(companies_store.list_all())}')
print(f'👥 Usuários: {User.objects.count()}')
print(f'🔗 Associações: {len(union_to_user_ids)}')

print('\n🏢 Sindicatos:')
for sindicato in unions_store.list_all():
    print(f'  - {sindicato[\"nome\"]} (ID: {sindicato[\"id\"]})')

print('\n🏭 Empresas:')
for empresa in companies_store.list_all():
    print(f'  - {empresa[\"nome\"]} (ID: {empresa[\"id\"]})')

print('\n👥 Usuários:')
for user in User.objects.all()[:5]:  # Mostrar apenas os primeiros 5
    print(f'  - {user.first_name} {user.last_name} ({user.email})')
if User.objects.count() > 5:
    print(f'  ... e mais {User.objects.count() - 5} usuários')
"

echo -e "\n\n✅ Sistema populado com dados de exemplo!"
echo "🌐 Acesse: https://veramo.com.br"
echo "👤 Login: admin@veramo.com / admin123"
echo "📊 Agora o painel deve mostrar dados!"
