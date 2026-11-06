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
          colorPrimary: "#423b32",
          borderRadius: 8,
          fontFamily: "inherit",
        },
        components: {
          Table: {
            headerBg: "#f7f5f1",
            headerColor: "#473f38",
            borderColor: "#e7e2da",
          },
          Modal: {
            borderRadiusLG: 10,
          },
          Drawer: {
            footerPaddingBlock: 12,
            footerPaddingInline: 16,
          },
          Button: {
            borderRadius: 8,
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
          Card: {
            borderRadiusLG: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
