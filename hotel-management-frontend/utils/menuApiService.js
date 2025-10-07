// File: utils/menuApiService.js - NEW UTILITY FOR CONSISTENT API CALLS
class MenuApiService {
  constructor(accessToken) {
    this.baseURL = '/api/restaurant';
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getCategories() {
    const response = await fetch(`${this.baseURL}/menu/categories/`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async getItems() {
    const response = await fetch(`${this.baseURL}/menu/items/`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async getMenuForOrdering() {
    const response = await fetch(`${this.baseURL}/menu-for-ordering/`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async createCategory(categoryData) {
    const response = await fetch(`${this.baseURL}/menu/categories/`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async updateCategory(id, categoryData) {
    const response = await fetch(`${this.baseURL}/menu/categories/${id}/`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async deleteCategory(id) {
    const response = await fetch(`${this.baseURL}/menu/categories/${id}/`, {
      method: 'DELETE',
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  }

  async createItem(itemData) {
    const response = await fetch(`${this.baseURL}/menu/items/`, {
      method: 'POST', 
      headers: this.headers,
      body: JSON.stringify(itemData)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async updateItem(id, itemData) {
    const response = await fetch(`${this.baseURL}/menu/items/${id}/`, {
      method: 'PUT',
      headers: this.headers, 
      body: JSON.stringify(itemData)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async deleteItem(id) {
    const response = await fetch(`${this.baseURL}/menu/items/${id}/`, {
      method: 'DELETE',
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  }
}

export default MenuApiService;

