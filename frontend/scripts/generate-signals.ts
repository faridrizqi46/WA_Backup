import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.OPENAI_API_KEY;

const MD_FILE = path.join(process.cwd(), 'app', 'doc', 'Corporate_Product_Parameters_EN.md');
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'product-signals.json');

interface SignalEntry {
  product: string;
  signals: string[];
  generatedAt: string;
}

interface SignalsMap {
  [key: string]: SignalEntry;
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function callLLM(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a trade finance expert. Extract relevant search signals (keywords/phrases) from product descriptions. Return ONLY a JSON object with product codes as keys and arrays of relevant search terms as values. Each product section starts with "## N. PRODUCT_NAME".'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function extractSignalsFromMD(content: string): Promise<SignalsMap> {
  const prompt = `Extract search signals (keywords and phrases) for each product from this corporate product parameters document. Group signals that would be useful for semantic similarity search in a trade finance context.

Products to identify:
- LC (Letter of Credit): Look for signals related to international trade, import/export, payment risk, documentary credit
- SCF (Supply Chain Finance): Look for signals related to anchor buyers, supplier networks, working capital, invoice financing, supply chain relationships

Return a JSON object with this exact format:
{
  "LC": {
    "product": "Letter of Credit",
    "signals": ["keyword1", "keyword2", ...],
    "generatedAt": "ISO timestamp"
  },
  "SCF": {
    "product": "Supply Chain Finance", 
    "signals": ["keyword1", "keyword2", ...],
    "generatedAt": "ISO timestamp"
  }
}

Include 10-20 relevant signals per product. Focus on terms that help identify companies suitable for each product.

Document content:
${content}`;

  const response = await callLLM(prompt);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response as JSON');
  }

  const signals = JSON.parse(jsonMatch[0]);
  signals.LC.generatedAt = new Date().toISOString();
  signals.SCF.generatedAt = new Date().toISOString();

  return signals;
}

async function main() {
  console.log('=== Product Signals Generator ===');
  console.log('Reading:', MD_FILE);

  if (!fs.existsSync(MD_FILE)) {
    console.error('Error: MD file not found at', MD_FILE);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(MD_FILE, 'utf-8');
  console.log('MD content length:', mdContent.length, 'chars');

  if (!API_KEY) {
    console.error('Error: OPENAI_API_KEY not set');
    console.log('Using fallback signals from hardcoded data...');
    process.exit(1);
  }

  console.log('Calling LLM to extract signals...');
  const signals = await extractSignalsFromMD(mdContent);

  console.log('Generated signals:');
  console.log(JSON.stringify(signals, null, 2));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(signals, null, 2), 'utf-8');
  console.log('Written to:', OUTPUT_FILE);
  console.log('Done!');
}

main().catch(console.error);