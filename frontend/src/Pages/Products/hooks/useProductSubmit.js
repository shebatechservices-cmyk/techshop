import API_BASE from "../../../services/api";
import {
  validateProductForm,
  checkDuplicateProduct,
  buildProductPayload,
  buildProductFormData,
} from "../utils/productSubmitHelpers";

const API = `${API_BASE}/master`;

export default function useProductSubmit({
  formState,
  attributesState,
  catalogState,
  onProductCreated,
}) {
  const handleSubmit = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    formState.setSaveError("");
    formState.setSaveSuccess("");
    formState.setDuplicatePopupMessage("");

    const {
      form,
      editingProductId,
      featureImageFile,
      galleryImageFiles,
    } = formState;

    const {
      selectedCategory,
      selectedSubCategory,
      selectedBrand,
      selectedModel,
      selectedSeries,
    } = attributesState;

    // 1. Validation
    const validationError = validateProductForm({
      form,
      selectedCategory,
      selectedSubCategory,
      selectedBrand,
      selectedModel,
      selectedSeries,
    });
    if (validationError) {
      formState.setSaveError(validationError);
      return;
    }

    // 2. Duplicate Detection
    const isDuplicate = checkDuplicateProduct({
      form,
      products: catalogState.products,
      editingProductId,
      selectedCategory,
      selectedSubCategory,
      selectedBrand,
      selectedModel,
      selectedSeries,
    });
    if (isDuplicate) {
      const msg = "Already added this product, add a new product for catalog";
      formState.setSaveError(msg);
      formState.setDuplicatePopupMessage(msg);
      return;
    }

    // 3. Payload Construction
    const payload = buildProductPayload({
      form,
      selectedCategory,
      selectedSubCategory,
      selectedBrand,
      selectedModel,
      selectedSeries,
    });

    try {
      const url = editingProductId ? `${API}/products/${editingProductId}` : `${API}/products`;
      const method = editingProductId ? "PUT" : "POST";

      let res;
      if (featureImageFile || (galleryImageFiles && galleryImageFiles.length > 0)) {
        const formData = buildProductFormData({
          payload,
          featureImageFile,
          galleryImageFiles,
        });
        res = await fetch(url, { method, body: formData });
      } else {
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || "Failed to save product";
        if (errMsg.includes("Already added") || res.status === 409) {
          const msg = "Already added this product, add a new product for catalog";
          formState.setSaveError(msg);
          formState.setDuplicatePopupMessage(msg);
          return;
        }
        throw new Error(errMsg);
      }

      const resData = await res.json();
      const targetId = editingProductId || resData.data?.id;

      if (targetId && (featureImageFile || galleryImageFiles.length)) {
        const imageData = new FormData();
        if (featureImageFile) {
          imageData.append("images", featureImageFile);
          imageData.append("type", "feature");
        }
        galleryImageFiles.forEach((file) => imageData.append("images", file));
        await fetch(`${API.replace("/master", "")}/images/products/${targetId}`, {
          method: "POST",
          body: imageData,
        }).catch(() => {});
      }

      const refreshedProducts = await catalogState.reloadProducts();
      formState.handleResetForm();
      formState.setIsAddProductOpen(false);
      formState.setSaveSuccess(
        editingProductId
          ? "Product specifications updated successfully."
          : "Product added to catalog successfully."
      );
      if (onProductCreated && !editingProductId) {
        const created = (Array.isArray(refreshedProducts) ? refreshedProducts.find((p) => p.id === targetId) : null) || resData.data;
        if (created) {
          onProductCreated(created);
        }
      }
      setTimeout(() => formState.setSaveSuccess(""), 4000);
    } catch (error) {
      formState.setSaveError(error.message || "Failed to save product. Please check all fields.");
      console.error("Submit error:", error);
    }
  };

  return {
    handleSubmit,
  };
}
