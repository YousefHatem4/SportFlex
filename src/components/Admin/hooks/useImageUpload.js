// hooks/useImageUpload.js - Image upload hook
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../supabaseClient";

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const additionalFileInputRef = useRef(null);

  const uploadImage = async (file, folder = "products") => {
    try {
      if (!file) return null;

      const fileExt = file.name.split(".").pop().toLowerCase();
      const allowedTypes = ["jpg", "jpeg", "png", "gif", "webp"];
      if (!allowedTypes.includes(fileExt)) {
        toast.error("Please upload an image file (jpg, png, gif, webp)");
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return null;
      }

      setUploading(true);
      setUploadProgress(0);

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;
      setUploadProgress(100);

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      toast.success("Image uploaded successfully!");
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleMainImageUpload = async (e, setProductForm, productForm) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file, "products");
      if (url) {
        setProductForm({ ...productForm, image_url: url });
      }
    }
  };

  const handleAdditionalImageUpload = async (
    e,
    setProductForm,
    productForm,
  ) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file, "products/additional");
      if (url) {
        setProductForm({
          ...productForm,
          additionalImages: [...productForm.additionalImages, url],
        });
      }
    }
  };

  const handleCategoryImageUpload = async (
    e,
    setCategoryForm,
    categoryForm,
  ) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file, "categories");
      if (url) {
        setCategoryForm({ ...categoryForm, image_url: url });
      }
    }
  };

  const removeMainImage = (setProductForm, productForm) => {
    setProductForm({ ...productForm, image_url: "" });
  };

  const removeAdditionalImage = (index, setProductForm, productForm) => {
    const newImages = [...productForm.additionalImages];
    newImages.splice(index, 1);
    setProductForm({
      ...productForm,
      additionalImages: newImages,
    });
  };

  const removeCategoryImage = (setCategoryForm, categoryForm) => {
    setCategoryForm({ ...categoryForm, image_url: "" });
  };

  return {
    uploading,
    uploadProgress,
    uploadImage,
    handleMainImageUpload: (e, setProductForm, productForm) =>
      handleMainImageUpload(e, setProductForm, productForm),
    handleAdditionalImageUpload: (e, setProductForm, productForm) =>
      handleAdditionalImageUpload(e, setProductForm, productForm),
    handleCategoryImageUpload: (e, setCategoryForm, categoryForm) =>
      handleCategoryImageUpload(e, setCategoryForm, categoryForm),
    removeMainImage: (setProductForm, productForm) =>
      removeMainImage(setProductForm, productForm),
    removeAdditionalImage: (index, setProductForm, productForm) =>
      removeAdditionalImage(index, setProductForm, productForm),
    removeCategoryImage: (setCategoryForm, categoryForm) =>
      removeCategoryImage(setCategoryForm, categoryForm),
    fileInputRef,
    additionalFileInputRef,
  };
};
