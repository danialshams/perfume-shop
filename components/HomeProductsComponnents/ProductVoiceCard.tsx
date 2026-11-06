"use client";
import { normalizeAssetUrl } from "@/lib/product";
import FertiniVoicePlayer from "@/components/maison/FertiniVoicePlayer";
type Props={voiceUrl:string;productName:string;compact?:boolean;className?:string;desktop?:boolean;defaultOpen?:boolean};
export default function ProductVoiceCard({voiceUrl,productName,className="",desktop=false}:Props){
 const safeUrl=normalizeAssetUrl(voiceUrl);
 return <FertiniVoicePlayer productName={productName} voiceUrl={safeUrl}
  className={(desktop?"hidden lg:block ":"lg:hidden ")+className}/>;
}
