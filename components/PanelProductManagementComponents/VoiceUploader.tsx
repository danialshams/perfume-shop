"use client";

import { useState } from "react";
import { Button, Form, message, Upload } from "antd";
import type { FormInstance, UploadProps } from "antd";
import { FileAudio, Trash2, UploadCloud } from "lucide-react";
import { uploadProductVoice } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

type VoiceUploaderProps = {
    form: FormInstance;
    validateBeforeUpload: (file: File) => boolean | Promise<boolean>;
};

export default function VoiceUploader({
    form,
    validateBeforeUpload,
}: VoiceUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);

    const voiceFile = Form.useWatch("voice_file", form);

    const customRequest: UploadProps["customRequest"] = async (options) => {
        const { file, onSuccess, onError } = options;

        try {
            setIsUploading(true);

            // گرفتن فایل واقعی از Antd
            const actualFile = (file as any).originFileObj || file; // مهم

            const uploaded = await uploadProductVoice(actualFile as File);

            form.setFieldValue("voice_file", uploaded.url);

            form.setFields([
                {
                    name: "voice_file",
                    errors: [],
                },
            ]);

            onSuccess?.(uploaded);
            message.success("فایل صوتی با موفقیت آپلود شد");
        } catch (error) {
            onError?.(error as Error);

            message.error(
                error instanceof Error
                    ? error.message
                    : "آپلود فایل صوتی با خطا مواجه شد",
            );
        } finally {
            setIsUploading(false);
        }
    };

    const safeVoiceFile =
        typeof voiceFile === "string" &&
            !voiceFile.includes("fakepath") &&
            !voiceFile.startsWith("C:")
            ? voiceFile
            : "";

    return (
        <Form.Item label="فایل صوتی معرفی محصول" name="voice_file">
            <div className="space-y-3">
                {voiceFile ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2 text-neutral-700">
                            <FileAudio size={20} />
                            <span className="font-medium">فایل صوتی آپلود شده</span>
                        </div>

                        {safeVoiceFile && <audio controls src={safeVoiceFile} className="w-full" />}

                        <div className="mt-3 flex flex-wrap gap-2">
                            <Upload
                                accept=".mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm,.mp4,.mpeg,.mpga,.opus,.3gp,.amr,.aiff,.aif,.caf,.wma"
                                maxCount={1}
                                showUploadList={false}
                                beforeUpload={(file) => validateBeforeUpload(file as File)}
                                customRequest={customRequest}
                            >
                                <Button
                                    loading={isUploading}
                                    icon={<UploadCloud size={16} />}
                                >
                                    تغییر فایل صوتی
                                </Button>
                            </Upload>

                            <Button
                                danger
                                icon={<Trash2 size={16} />}
                                onClick={() => {
                                    form?.setFieldValue("voice_file", undefined);
                                    form?.setFields([
                                        {
                                            name: "voice_file",
                                            errors: [],
                                        },
                                    ]);
                                }}

                            >
                                حذف فایل صوتی
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
                        <div className="mb-3 flex justify-center text-neutral-500">
                            <FileAudio size={30} />
                        </div>

                        <div className="mb-2 font-medium text-neutral-700">
                            فایل صوتی محصول را آپلود کنید
                        </div>

                        <div className="mb-4 text-sm text-neutral-500">
                            فرمت‌های مجاز: mp3, wav, ogg, m4a و... - حداکثر {formatBytes(20 * 1024 * 1024)}
                        </div>

                        <Upload
                            accept=".mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm,.mp4,.mpeg,.mpga,.opus,.3gp,.amr,.aiff,.aif,.caf,.wma"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={(file) => validateBeforeUpload(file as File)}
                            customRequest={customRequest}
                        >
                            <Button
                                size="large"
                                loading={isUploading}
                                icon={<UploadCloud size={16} />}
                            >
                                انتخاب فایل صوتی
                            </Button>
                        </Upload>
                    </div>
                )}
            </div>
        </Form.Item>
    );
}
