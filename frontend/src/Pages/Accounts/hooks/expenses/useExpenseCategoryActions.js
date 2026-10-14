import { useState } from 'react';
import API from '../../../../services/api';

export default function useExpenseCategoryActions({
  setCategories,
  setNewExpense,
  editingExpense,
  setEditingExpense,
  setOverview,
  showToast,
}) {
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [savingCatId, setSavingCatId] = useState(null);
  const [deletingCatId, setDeletingCatId] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch(`${API}/expense-categories`);
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d) ? d : d.data || [];
        if (Array.isArray(list)) {
          setCategories(list);
          return list;
        }
      }
    } catch (err) {
      console.error('Failed to load expense categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
    return [];
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;

    try {
      setCategorySubmitting(true);
      const res = await fetch(`${API}/expense-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || errData.error || 'Failed to create category');
        return;
      }

      const resData = await res.json();
      const savedCat = resData.data || resData;

      setIsAddCategoryOpen(false);
      setNewCategoryName('');

      const updatedList = await fetchExpenseCategories();
      const matched = updatedList?.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      );
      const selectedName = matched ? matched.name : savedCat?.name || catName;
      const selectedId = matched?.id || savedCat?.id || null;

      setNewExpense((prev) => ({
        ...prev,
        category_name: selectedName,
        category_id: selectedId,
      }));

      if (editingExpense) {
        setEditingExpense((prev) => ({
          ...prev,
          category_name: selectedName,
          category_id: selectedId,
        }));
      }

      showToast(`Category "${selectedName}" created and selected!`);
    } catch (err) {
      console.error('Error creating expense category:', err);
      alert('Error creating category');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setEditingCatName('');
  };

  const handleSaveEditCategory = async (id) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      alert('Category name cannot be empty');
      return;
    }

    try {
      setSavingCatId(id);
      const res = await fetch(`${API}/expense-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(resData.message || resData.error || 'Failed to update category');
        return;
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );

      setNewExpense((prev) =>
        prev.category_id === id ? { ...prev, category_name: trimmed } : prev
      );
      if (editingExpense && editingExpense.category_id === id) {
        setEditingExpense((prev) => ({ ...prev, category_name: trimmed }));
      }

      setEditingCatId(null);
      setEditingCatName('');
      showToast(`Category updated to "${trimmed}"!`);

      fetch(`${API}/expenses/overview`)
        .then((r) => r.json())
        .then((d) => d.data && setOverview(d.data))
        .catch(console.error);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Error updating category');
    } finally {
      setSavingCatId(null);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      setDeletingCatId(cat.id);
      const res = await fetch(`${API}/expense-categories/${cat.id}`, {
        method: 'DELETE',
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          resData.message ||
          resData.error ||
          'Cannot delete category: Existing expense records are using it';
        alert(errorMsg);
        showToast(errorMsg);
        return;
      }

      setCategories((prev) => {
        const nextList = prev.filter((c) => c.id !== cat.id);
        setNewExpense((p) => {
          if (p.category_id === cat.id || p.category_name === cat.name) {
            return {
              ...p,
              category_name: nextList[0]?.name || '',
              category_id: nextList[0]?.id || null,
            };
          }
          return p;
        });
        return nextList;
      });

      showToast(`Category "${cat.name}" deleted successfully!`);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error deleting category');
    } finally {
      setDeletingCatId(null);
    }
  };

  return {
    categoriesLoading,
    setCategoriesLoading,
    categorySubmitting,
    setCategorySubmitting,
    editingCatId,
    setEditingCatId,
    editingCatName,
    setEditingCatName,
    savingCatId,
    setSavingCatId,
    deletingCatId,
    setDeletingCatId,
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    isManageCategoriesOpen,
    setIsManageCategoriesOpen,
    categorySearchQuery,
    setCategorySearchQuery,
    newCategoryName,
    setNewCategoryName,
    newCategoryDesc,
    setNewCategoryDesc,
    fetchExpenseCategories,
    handleCreateCategory,
    handleStartEditCategory,
    handleCancelEditCategory,
    handleSaveEditCategory,
    handleDeleteCategory,
  };
}
