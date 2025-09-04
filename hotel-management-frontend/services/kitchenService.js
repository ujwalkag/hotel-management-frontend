const kitchenService = {
  async getOrders(token) {
    const response = await fetch('/api/tables/kitchen/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch orders / ऑर्डर प्राप्त करने में विफल: ${response.statusText}`);
    }
    
    return response.json();
  },

  async updateOrderStatus(token, orderId, status) {
    const response = await fetch(`/api/tables/kitchen/${orderId}/update_status/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update status / स्थिति अपडेट करने में विफल: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getSummary(token) {
    const response = await fetch('/api/tables/kitchen/summary/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch summary / सारांश प्राप्त करने में विफल: ${response.statusText}`);
    }
    
    return response.json();
  },

  async bulkUpdateOrders(token, updates) {
    const response = await fetch('/api/tables/kitchen/bulk_update/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to bulk update / बल्क अपडेट करने में विफल: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default kitchenService;
