#!/bin/bash

# GitHub Setup Script for Dashboard MECOBE Premium
# Este script ajuda a configurar o repositório no GitHub

echo "🚀 Dashboard MECOBE Premium - GitHub Setup"
echo "=========================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este diretório não é um repositório Git"
    exit 1
fi

echo "📋 Informações do Projeto:"
echo "Nome do Repositório: dashboard-mecobe-premium"
echo "Descrição: Dashboard MECOBE Premium - Sistema Avançado de Matriz de Segmentação Médica"
echo ""

echo "🔧 Status atual do Git:"
git status --short
echo ""

echo "📝 Últimos commits:"
git log --oneline -3
echo ""

echo "📋 PASSOS PARA CRIAR O REPOSITÓRIO NO GITHUB:"
echo ""
echo "1. 🌐 Acesse https://github.com/new"
echo ""
echo "2. ⚙️  Configure o repositório:"
echo "   - Repository name: dashboard-mecobe-premium"
echo "   - Description: Dashboard MECOBE Premium - Sistema Avançado de Matriz de Segmentação Médica com Integração Excel"
echo "   - Visibility: Public ✅"
echo "   - ❌ NÃO inicialize com README, .gitignore ou LICENSE (já temos)"
echo ""
echo "3. 📋 Após criar, execute estes comandos:"
echo ""

# Get the current user (try to detect from git config)
GIT_USER=$(git config user.name 2>/dev/null || echo "SEU_USERNAME")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "seu@email.com")

echo "   # Adicionar remote origin (substitua SEU_USERNAME pelo seu usuário GitHub)"
echo "   git remote add origin https://github.com/SEU_USERNAME/dashboard-mecobe-premium.git"
echo ""
echo "   # Fazer push inicial"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "4. 🌐 Ativar GitHub Pages (opcional):"
echo "   - Vá em Settings > Pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: main / (root)"
echo "   - Save"
echo ""

echo "📊 Estatísticas do Projeto:"
echo "Arquivos: $(find . -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.md" | wc -l | xargs)"
echo "Linhas de código: $(cat *.js *.css *.html 2>/dev/null | wc -l | xargs)"
echo "Tamanho total: $(du -sh . | cut -f1)"
echo ""

echo "✅ Configuração Git atual:"
echo "User: $GIT_USER"
echo "Email: $GIT_EMAIL"
echo "Branch: $(git branch --show-current)"
echo "Remote: $(git remote -v 2>/dev/null || echo 'Nenhum remote configurado')"
echo ""

echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Criar o repositório no GitHub seguindo os passos acima"
echo "2. Executar os comandos git remote e push"
echo "3. Verificar se o dashboard está funcionando no GitHub Pages"
echo ""

echo "📞 Em caso de dúvidas:"
echo "- Documentação GitHub: https://docs.github.com"
echo "- Suporte: https://support.github.com"
echo ""

echo "🎉 Dashboard MECOBE Premium pronto para o GitHub!"