#!/usr/bin/env python
import sqlite3
import os
import shutil

def limpar_homologacoes_direto():
    """Limpa homologações usando SQLite diretamente"""
    
    db_path = 'db.sqlite3'
    
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados não encontrado: {db_path}")
        return False
    
    print("🧹 Limpando homologações do sistema...")
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Contadores
        contadores = {}
        
        # 1. Verificar e limpar documentos
        cursor.execute("SELECT COUNT(*) FROM core_document")
        contadores['documentos'] = cursor.fetchone()[0]
        
        cursor.execute("DELETE FROM core_document")
        print(f"✅ {contadores['documentos']} documentos removidos")
        
        # 2. Verificar e limpar processos de demissão
        cursor.execute("SELECT COUNT(*) FROM core_demissaoprocess")
        contadores['processos'] = cursor.fetchone()[0]
        
        cursor.execute("DELETE FROM core_demissaoprocess")
        print(f"✅ {contadores['processos']} processos removidos")
        
        # 3. Verificar e limpar agendamentos
        cursor.execute("SELECT COUNT(*) FROM core_schedule")
        contadores['agendamentos'] = cursor.fetchone()[0]
        
        cursor.execute("DELETE FROM core_schedule")
        print(f"✅ {contadores['agendamentos']} agendamentos removidos")
        
        # 4. Verificar e limpar logs relacionados
        cursor.execute("""
            SELECT COUNT(*) FROM core_systemlog 
            WHERE action IN (
                'DOCUMENT_UPLOADED',
                'DOCUMENT_APPROVED', 
                'DOCUMENT_REJECTED',
                'HOMOLOGATION_COMPLETED',
                'SCHEDULE_CREATED',
                'SCHEDULE_UPDATED',
                'SCHEDULE_DELETED'
            )
        """)
        contadores['logs'] = cursor.fetchone()[0]
        
        cursor.execute("""
            DELETE FROM core_systemlog 
            WHERE action IN (
                'DOCUMENT_UPLOADED',
                'DOCUMENT_APPROVED', 
                'DOCUMENT_REJECTED',
                'HOMOLOGATION_COMPLETED',
                'SCHEDULE_CREATED',
                'SCHEDULE_UPDATED',
                'SCHEDULE_DELETED'
            )
        """)
        print(f"✅ {contadores['logs']} logs removidos")
        
        # Commit das mudanças
        conn.commit()
        conn.close()
        
        # 5. Limpar arquivos físicos
        arquivos_removidos = 0
        try:
            if os.path.exists('media/documents/'):
                shutil.rmtree('media/documents/')
                print("✅ Diretório 'media/documents/' removido")
                arquivos_removidos += 1
            
            if os.path.exists('media/assinaturas/'):
                shutil.rmtree('media/assinaturas/')
                print("✅ Diretório 'media/assinaturas/' removido")
                arquivos_removidos += 1
        except Exception as e:
            print(f"⚠️ Erro ao limpar diretórios: {e}")
        
        # Relatório final
        print("\n" + "="*50)
        print("📊 RELATÓRIO DE LIMPEZA")
        print("="*50)
        print(f"📋 Processos de demissão: {contadores['processos']}")
        print(f"📄 Documentos: {contadores['documentos']}")
        print(f"📅 Agendamentos: {contadores['agendamentos']}")
        print(f"📝 Logs: {contadores['logs']}")
        print(f"🗂️ Diretórios removidos: {arquivos_removidos}")
        print("="*50)
        print("✅ Limpeza concluída com sucesso!")
        print("🎯 Sistema pronto para testar distribuição")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a limpeza: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🧹 Script de Limpeza Direta (SQLite)")
    print("="*50)
    
    sucesso = limpar_homologacoes_direto()
    if sucesso:
        print("\n🎉 Sistema limpo e pronto para novos testes!")
    else:
        print("\n💥 Falha na limpeza. Verifique os logs acima.")
