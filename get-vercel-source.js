#!/usr/bin/env node

/**
 * Script om source code informatie van Vercel deployment op te halen
 * Dit gebruikt de Vercel API om deployment details te krijgen
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'prj_1Qbyn6pYoAuR7Ij6K29ei6MOcurA';

async function getVercelToken() {
  // Probeer token te vinden in ~/.vercel/auth.json
  const authPath = path.join(process.env.HOME, '.vercel', 'auth.json');
  try {
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    return auth.token;
  } catch (e) {
    console.error('❌ Kan Vercel token niet vinden. Voer eerst uit: npx vercel login');
    process.exit(1);
  }
}

async function apiRequest(url, token) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'vercel-source-fetcher'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Vercel Deployment Source Code Info Ophalen');
  console.log('==============================================\n');

  const token = await getVercelToken();
  console.log('✅ Token gevonden\n');

  // Get latest production deployment
  console.log('📥 Ophalen van production deployments...');
  const deploymentsUrl = `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&limit=1&target=production`;
  
  try {
    const deployments = await apiRequest(deploymentsUrl, token);
    
    if (!deployments.deployments || deployments.deployments.length === 0) {
      console.error('❌ Geen production deployments gevonden');
      process.exit(1);
    }

    const deployment = deployments.deployments[0];
    console.log('\n✅ Deployment gevonden:');
    console.log(`   URL: ${deployment.url}`);
    console.log(`   State: ${deployment.state}`);
    console.log(`   Created: ${new Date(deployment.createdAt).toLocaleString()}`);
    
    if (deployment.meta) {
      console.log(`\n📋 Source Info:`);
      if (deployment.meta.githubCommitSha) {
        console.log(`   GitHub Commit SHA: ${deployment.meta.githubCommitSha}`);
        console.log(`   GitHub Commit Ref: ${deployment.meta.githubCommitRef || 'N/A'}`);
        console.log(`   GitHub Commit Message: ${deployment.meta.githubCommitMessage || 'N/A'}`);
      }
      if (deployment.meta.githubCommitAuthorName) {
        console.log(`   Author: ${deployment.meta.githubCommitAuthorName}`);
      }
    }

    // Get deployment files (source code info)
    console.log(`\n📁 Proberen deployment files op te halen...`);
    const filesUrl = `https://api.vercel.com/v13/deployments/${deployment.uid}/files`;
    
    try {
      const files = await apiRequest(filesUrl, token);
      console.log(`   ✅ ${files.files?.length || 0} files gevonden`);
      
      if (files.files && files.files.length > 0) {
        console.log(`\n📄 Eerste 20 files:`);
        files.files.slice(0, 20).forEach((file, i) => {
          console.log(`   ${i + 1}. ${file.name || file.file || 'unknown'} (${file.size || 'unknown'} bytes)`);
        });
      }
    } catch (e) {
      console.log(`   ⚠️  Kan files niet ophalen: ${e.message}`);
      console.log(`   Dit is normaal - Vercel API geeft geen directe file access`);
    }

    // Checkout instructions
    if (deployment.meta?.githubCommitSha) {
      const commitSha = deployment.meta.githubCommitSha;
      console.log(`\n🎯 VOLGENDE STAPPEN:`);
      console.log(`   Om deze versie lokaal te krijgen:`);
      console.log(`   1. git fetch origin --all`);
      console.log(`   2. git checkout ${commitSha}`);
      console.log(`   3. rm -rf node_modules dist .vite`);
      console.log(`   4. npm install`);
      console.log(`   5. npm run dev`);
    } else {
      console.log(`\n⚠️  Geen GitHub commit SHA gevonden in deployment.`);
      console.log(`   Dit betekent mogelijk dat de deployment direct is geüpload zonder git.`);
      console.log(`   In dat geval moet je de source code handmatig downloaden via Vercel Dashboard.`);
    }

  } catch (error) {
    console.error('❌ Fout bij ophalen deployment info:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main().catch(console.error);





