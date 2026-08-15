import ProductsManagement from "@/components/PanelProductManagementComponents/products-management";
import { App as AntdApp } from "antd";

export default function AdminProductsPage() {
  return (
    <AntdApp>
      <ProductsManagement />
    </AntdApp>
  );
}
