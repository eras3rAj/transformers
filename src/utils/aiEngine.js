// Generative AI ERP Assistant Engine
// Hybrid approach: Uses API key if available, otherwise falls back to a deterministic rule-based engine.

export const generateAIResponse = async (query, contextData, apiKey) => {
  if (apiKey) {
    return await fetchGeminiResponse(query, contextData, apiKey);
  } else {
    return simulateAIResponse(query, contextData);
  }
};

const simulateAIResponse = (query, context) => {
  const q = query.toLowerCase();
  
  if (q.includes('expense') || q.includes('spend') || q.includes('cost')) {
    const total = context.expenses.reduce((sum, e) => sum + (e.status === 'Approved' ? Number(e.amount) : 0), 0);
    return `Based on your records, the total approved expenses amount to ₹${total.toFixed(2)}. There are ${context.expenses.filter(e => e.status === 'Pending').length} pending expenses waiting for approval.`;
  }
  
  if (q.includes('inventory') || q.includes('stock') || q.includes('shortage')) {
    const lowStock = context.inventory.filter(i => {
      const min = i.minStockLevels?.[i.category] || 0;
      const current = context.inventoryStats[i.name] || 0;
      return current < min;
    });
    
    if (lowStock.length === 0) {
      return "Good news! All your inventory items are currently above their minimum stock thresholds.";
    } else {
      return `Warning: You have ${lowStock.length} items below minimum stock levels. Critical shortages include: ${lowStock.map(i => i.name).join(', ')}.`;
    }
  }

  if (q.includes('production') || q.includes('build') || q.includes('yield')) {
    const totalProduced = context.production.reduce((sum, p) => sum + Number(p.quantity), 0);
    return `To date, you have logged production for ${totalProduced} units. Check the Executive Dashboard for a detailed yield breakdown.`;
  }

  if (q.includes('purchase order') || q.includes('po') || q.includes('orders')) {
    if (!context.purchaseOrders || context.purchaseOrders.length === 0) {
      return "You currently have no purchase orders in the system.";
    }
    const pending = context.purchaseOrders.filter(po => po.status === 'Pending').length;
    return `You have ${context.purchaseOrders.length} total purchase orders, with ${pending} currently pending.`;
  }

  if (q.includes('hello') || q.includes('hi ')) {
    return "Hello! I am your VoltForge AI Assistant. Ask me about your expenses, inventory shortages, production stats, or purchase orders!";
  }

  return "I'm sorry, I couldn't understand that query. Try asking about 'expenses', 'inventory shortages', 'production totals', or 'purchase orders'. (Simulated Mode)";
};

const fetchGeminiResponse = async (query, context, apiKey) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const systemPrompt = `You are an AI ERP Assistant named VoltForge AI. You have access to the following ERP data: ${JSON.stringify(context)}. Provide concise, helpful answers.`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `System: ${systemPrompt}\nUser: ${query}` }] }]
      })
    });
    
    if (!response.ok) throw new Error('API Request Failed');
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("AI Engine Error:", err);
    return "I'm having trouble connecting to the AI service right now. Please try again later or check your API key.";
  }
};
