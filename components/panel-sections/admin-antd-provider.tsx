"use client";
import {ConfigProvider} from "antd";
import faIR from "antd/locale/fa_IR";
import type {ReactNode} from "react";
/** Shared neutral Fertini design tokens, including every AntD portal and form. */
export default function AdminAntdProvider({children}:{children:ReactNode}){
 return <ConfigProvider direction="rtl" locale={faIR} theme={{
  token:{
   colorPrimary:"#425e4b",colorInfo:"#425e4b",colorLink:"#425e4b",
   colorBgBase:"#ffffff",colorBgContainer:"#ffffff",colorBgLayout:"#f6f5f1",
   colorText:"#253b2c",colorTextSecondary:"#718478",
   colorBorder:"#e2e9e2",colorSplit:"#ebefea",
   borderRadius:6,borderRadiusLG:8,borderRadiusSM:4,
   controlHeight:42,controlHeightLG:46,
   fontFamily:'"Vazirmatn RD","Vazirmatn",Tahoma,sans-serif',fontSize:13,
   boxShadow:"none",boxShadowSecondary:"0 6px 24px #2229220d"
  },
  components:{
   Button:{primaryShadow:"none",borderRadius:6,fontWeight:500},
   Table:{headerBg:"#f8faf7",headerColor:"#637a68",borderColor:"#e5ece4",cellPaddingBlock:14,cellPaddingInline:15},
   Input:{activeShadow:"0 0 0 3px #8faf951c",paddingBlock:10},
   Select:{optionSelectedBg:"#edf4eb"},
   Card:{borderRadiusLG:8,boxShadow:"none"},
   Modal:{borderRadiusLG:9},
   Drawer:{footerPaddingBlock:15,footerPaddingInline:18},
   Form:{labelColor:"#455f4b",verticalLabelPadding:"0 0 7px"},
   Alert:{borderRadiusLG:7},
   Pagination:{itemActiveBg:"#edf4eb"}
  }
 }}>{children}</ConfigProvider>;
}
