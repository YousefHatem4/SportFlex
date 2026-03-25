// hooks/useStockManagement.js - Stock management hook
import { supabase } from "../../../supabaseClient";
import toast from "react-hot-toast";

export const useStockManagement = ({
  products,
  categories,
  orders,
  users,
  fetchProductsWithImages,
  calculateStats,
}) => {
  const decreaseProductStock = async (orderId) => {
    try {
      console.log("Decreasing stock for shipped order:", orderId);
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`product_id, quantity, product_title`)
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;

      for (const item of orderItems) {
        if (item.product_id) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (productError) {
            console.error(
              `Error fetching product ${item.product_id}:`,
              productError,
            );
            continue;
          }
          const newStock = Math.max(0, product.stock - item.quantity);
          const { error: updateError } = await supabase
            .from("products")
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq("id", item.product_id);
          if (updateError) {
            console.error(
              `Error updating stock for product ${item.product_id}:`,
              updateError,
            );
          } else {
            console.log(
              `Updated stock for product ${item.product_title}: ${product.stock} → ${newStock}`,
            );
          }
        }
      }

      const refreshedProducts = await fetchProductsWithImages();
      calculateStats(refreshedProducts, categories, orders, users);
      return true;
    } catch (error) {
      console.error("Error decreasing product stock:", error);
      return false;
    }
  };

  const returnProductStock = async (orderId) => {
    try {
      console.log("Returning stock for order:", orderId);
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`product_id, quantity, product_title`)
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;

      for (const item of orderItems) {
        if (item.product_id) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (productError) {
            console.error(
              `Error fetching product ${item.product_id}:`,
              productError,
            );
            continue;
          }
          const newStock = product.stock + item.quantity;
          const { error: updateError } = await supabase
            .from("products")
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq("id", item.product_id);
          if (updateError) {
            console.error(
              `Error updating stock for product ${item.product_id}:`,
              updateError,
            );
          } else {
            console.log(
              `Returned stock for product ${item.product_title}: ${product.stock} → ${newStock}`,
            );
          }
        }
      }

      const refreshedProducts = await fetchProductsWithImages();
      calculateStats(refreshedProducts, categories, orders, users);
      return true;
    } catch (error) {
      console.error("Error returning product stock:", error);
      return false;
    }
  };

  return {
    decreaseProductStock,
    returnProductStock,
  };
};
