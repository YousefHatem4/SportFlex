// hooks/useAdminData.js - Data fetching hook
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../supabaseClient";

export const useAdminData = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [shippingCosts, setShippingCosts] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalUsersOrdered: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const fetchProductsWithImages = async () => {
    try {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          `
                    *,
                    categories (
                        id,
                        name
                    )
                `,
        )
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      const productsWithImages = await Promise.all(
        products.map(async (product) => {
          const { data: images, error: imagesError } = await supabase
            .from("product_images")
            .select("*")
            .eq("product_id", product.id)
            .order("display_order", { ascending: true });
          if (imagesError) throw imagesError;
          return { ...product, images: images || [] };
        }),
      );
      return productsWithImages || [];
    } catch (error) {
      console.error("Error fetching products with images:", error);
      toast.error("Failed to load products");
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
      return [];
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
                    *,
                    order_items (
                        id,
                        product_title,
                        quantity,
                        price,
                        product_id
                    )
                `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      return [];
    }
  };

  const fetchShippingCosts = async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_costs")
        .select("*")
        .order("governorate");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching shipping costs:", error);
      toast.error("Failed to load shipping costs");
      return [];
    }
  };

  const fetchSpecialOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("special_offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching special offers:", error);
      toast.error("Failed to load special offers");
      return [];
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Failed to load promo codes");
      return [];
    }
  };

  const calculateStats = (
    productsData,
    categoriesData,
    ordersData,
    usersData,
  ) => {
    const totalRevenue = ordersData.reduce(
      (sum, order) => sum + parseFloat(order.total_amount || 0),
      0,
    );
    const uniqueUserIds = new Set();
    ordersData.forEach((order) => {
      if (order.user_id) uniqueUserIds.add(order.user_id);
    });
    const totalUsersOrdered = uniqueUserIds.size;
    const lowStockCount = productsData.filter(
      (p) => p.stock > 0 && p.stock < 5,
    ).length;
    const outOfStockCount = productsData.filter((p) => p.stock === 0).length;

    setStats({
      totalProducts: productsData.length,
      totalCategories: categoriesData.length,
      totalOrders: ordersData.length,
      totalUsers: usersData.length,
      totalRevenue: totalRevenue,
      totalUsersOrdered: totalUsersOrdered,
      lowStockCount: lowStockCount,
      outOfStockCount: outOfStockCount,
    });
  };

  const loadInitialData = async () => {
    try {
      setIsInitializing(true);
      const [
        productsData,
        categoriesData,
        ordersData,
        usersData,
        shippingData,
        specialOffersData,
        promoCodesData,
      ] = await Promise.all([
        fetchProductsWithImages(),
        fetchCategories(),
        fetchOrders(),
        fetchUsers(),
        fetchShippingCosts(),
        fetchSpecialOffers(),
        fetchPromoCodes(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setOrders(ordersData);
      setUsers(usersData);
      setShippingCosts(shippingData);
      setSpecialOffers(specialOffersData);
      setPromoCodes(promoCodesData);
      calculateStats(productsData, categoriesData, ordersData, usersData);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsInitializing(false);
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    products,
    setProducts,
    categories,
    setCategories,
    orders,
    setOrders,
    users,
    setUsers,
    shippingCosts,
    setShippingCosts,
    specialOffers,
    setSpecialOffers,
    promoCodes,
    setPromoCodes,
    stats,
    isLoading,
    isInitializing,
    fetchProductsWithImages,
    fetchCategories,
    fetchOrders,
    fetchUsers,
    fetchShippingCosts,
    fetchSpecialOffers,
    fetchPromoCodes,
    calculateStats,
    refreshData,
  };
};
