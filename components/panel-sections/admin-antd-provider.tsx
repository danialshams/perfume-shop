"use client";
import {ConfigProvider} from "antd";
import faIR from "antd/locale/fa_IR";
import type {ReactNode} from "react";
/** Shared neutral Fertini design tokens, including every AntD portal and form. */
export default function AdminAntdProvider({children}:{children:ReactNode}){
 return <ConfigProvider direction="rtl" locale={faIR} theme={{
  token:{
   colorPrimary:"#30352f",colorInfo:"#30352f",colorLink:"#30352f",
   colorBgBase:"#ffffff",colorBgContainer:"#ffffff",colorBgLayout:"#f7f7f5",
   colorText:"#292c28",colorTextSecondary:"#757a72",
   colorBorder:"#e3e6e1",colorSplit:"#eceeea",
   borderRadius:11,borderRadiusLG:16,borderRadiusSM:8,
   controlHeight:42,controlHeightLG:46,
   fontFamily:'"Vazirmatn RD","Vazirmatn",Tahoma,sans-serif',fontSize:13,
   boxShadow:"none",boxShadowSecondary:"0 6px 24px #2229220d"
  },
  components:{
   Button:{primaryShadow:"none",borderRadius:10,fontWeight:550},
   Table:{headerBg:"#f8f8f6",headerColor:"#333730",borderColor:"#e8eae6",cellPaddingBlock:13,cellPaddingInline:14},
   Input:{activeShadow:"0 0 0 3px #8b978b1a",paddingBlock:10},
   Select:{optionSelectedBg:"#edeee9"},
   Card:{borderRadiusLG:16,boxShadow:"none"},
   Modal:{borderRadiusLG:16},
   Drawer:{footerPaddingBlock:15,footerPaddingInline:18},
   Form:{labelColor:"#4d524b",verticalLabelPadding:"0 0 7px"},
   Alert:{borderRadiusLG:12},
   Pagination:{itemActiveBg:"#eceeea"}
  }
 }}>{children}</ConfigProvider>;
}
