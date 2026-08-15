"use client";

import { ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";
import { ReactNode } from "react";

export default function AdminAntdProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConfigProvider
      direction="rtl"
      locale={faIR}
      theme={{
        token: {
          colorPrimary: "#7c3aed",
          borderRadius: 14,
          fontFamily: "inherit",
        },
        components: {
          Table: {
            headerBg: "#faf5ff",
            headerColor: "#3f3f46",
            borderColor: "#f1f5f9",
          },
          Modal: {
            borderRadiusLG: 20,
          },
          Drawer: {
            footerPaddingBlock: 12,
            footerPaddingInline: 16,
          },
          Button: {
            borderRadius: 12,
          },
          Input: {
            borderRadius: 12,
          },
          Select: {
            borderRadius: 12,
          },
          Card: {
            borderRadiusLG: 20,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
