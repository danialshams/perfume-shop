import { ReactNode } from "react";
import AdminShell from "@/components/admin/admin-shell";
import AdminAntdProvider from "@/components/panel-sections/admin-antd-provider";

type AdminPanelLayoutProps = {
    children: ReactNode;
};

export default function AdminPanelLayout({
    children,
}: AdminPanelLayoutProps) {
    return (
        <AdminAntdProvider>
            <AdminShell>{children}</AdminShell>
        </AdminAntdProvider>);
}
