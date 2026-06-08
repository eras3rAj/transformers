import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { generateAIResponse } from '../../utils/aiEngine';
import { useExpenses } from '../../context/ExpenseContext';
import { useInventory } from '../../context/InventoryContext';
import { useProduction } from '../../context/ProductionContext';
import { usePO } from '../../context/POContext';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, sender: 'ai', text: 'Hi! I am your VoltForge ERP Assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { expenses } = useExpenses();
  const { items, getGlobalStock } = useInventory();
  const { production } = useProduction();
  const { pos } = usePO();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await processSend(input.trim());
  };

  const processSend = async (text) => {
    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const inventoryStats = (items || []).reduce((acc, item) => {
        if (getGlobalStock) {
          acc[item.name] = getGlobalStock(item.name);
        }
        return acc;
      }, {});

      const contextData = {
        expenses,
        inventory: items,
        inventoryStats,
        production,
        purchaseOrders: pos
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      
      if (!apiKey) await new Promise(r => setTimeout(r, 600));

      const responseText = await generateAIResponse(text, contextData, apiKey);

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: responseText }]);
    } catch (error) {
      console.error('Error in AIAssistant:', error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "I encountered an internal error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const prompts = [
    "Total expenses",
    "Inventory shortages",
    "Production yield",
    "Pending purchase orders"
  ];

  return (
    <>
      <button 
        className="ai-fab"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Bot size={30} />
      </button>

      {isOpen && (
        <div 
          className="ai-chat-window animate-fade-in card"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '350px',
            height: '500px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1rem', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <Bot size={20} />
              ERP Assistant
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  backgroundColor: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.8rem', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            {prompts.map(prompt => (
              <button 
                key={prompt}
                onClick={() => processSend(prompt)}
                className="status-badge"
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-color)', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '16px', 
                  fontSize: '0.75rem', 
                  whiteSpace: 'nowrap', 
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
            <input 
              type="text" 
              className="input-field" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..." 
              style={{ marginBottom: 0, flex: 1, borderRadius: '20px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} disabled={isTyping}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
