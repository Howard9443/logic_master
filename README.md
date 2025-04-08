mkdir my-website && cd my-website
echo "# My Website" > README.md
git init
git add .
git commit -m "Initial commit"

# 连接到GitHub仓库
git remote add origin https://github.com/<Howard9443>/<logic_master>.git
git push -u origin main
