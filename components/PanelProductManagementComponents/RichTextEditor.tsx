"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    BoldOutlined,
    ClearOutlined,
    CodeOutlined,
    DeleteOutlined,
    FontColorsOutlined,
    ItalicOutlined,
    LinkOutlined,
    MinusOutlined,
    OrderedListOutlined,
    PictureOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    UnderlineOutlined,
    UndoOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Divider, Input, Modal, Select, Tooltip, message } from "antd";

type RichTextEditorProps = {
    value?: string | null;
    onChange?: (value: string) => void;
    uploadImage?: (file: File) => Promise<{ url: string }>;
    validateBeforeUpload?: (file: File) => boolean | Promise<boolean>;
    placeholder?: string;
    minHeight?: number;
    disabled?: boolean;
};

type ToolbarButtonProps = {
    title: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: ReactNode;
};

function ToolbarButton({
    title,
    onClick,
    active = false,
    disabled = false,
    children,
}: ToolbarButtonProps) {
    return (
        <Tooltip title={title}>
            <Button
                type={active ? "primary" : "text"}
                size="small"
                disabled={disabled}
                onClick={onClick}
                className={[
                    "flex items-center justify-center",
                    active ? "!bg-[#1b3a6b]" : "",
                ].join(" ")}
            >
                {children}
            </Button>
        </Tooltip>
    );
}

function getCurrentLink(editor: Editor) {
    return editor.getAttributes("link").href || "";
}

function normalizeHref(rawValue: string) {
    const value = rawValue.trim();

    if (!value) return "";

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("mailto:") ||
        value.startsWith("tel:")
    ) {
        return value;
    }

    return `https://${value}`;
}

export default function RichTextEditor({
    value = "",
    onChange,
    uploadImage,
    validateBeforeUpload,
    placeholder = "توضیحات محصول را وارد کنید...",
    minHeight = 320,
    disabled = false,
}: RichTextEditorProps) {
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [imageUrlModalOpen, setImageUrlModalOpen] = useState(false);
    const [imageUrlValue, setImageUrlValue] = useState("");
    const [imageUploading, setImageUploading] = useState(false);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),

            Underline,

            TextStyle,

            Color,

            TextAlign.configure({
                types: ["heading", "paragraph", "blockquote"],
                defaultAlignment: "right",
            }),

            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    target: "_blank",
                    rel: "noopener noreferrer",
                },
            }),

            TiptapImage.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    loading: "lazy",
                    decoding: "async",
                },
            }),

            Placeholder.configure({
                placeholder,
            }),
        ],
        [placeholder],
    );

    const editor = useEditor({
        extensions,
        content: value || "",
        editable: !disabled,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                dir: "rtl",
                class: [
                    "tiptap",
                    "min-h-full",
                    "w-full",
                    "px-4",
                    "py-4",
                    "text-right",
                    "text-[15px]",
                    "font-light",
                    "leading-8",
                    "text-[#33383C]",
                    "outline-none",
                    "[&_.is-editor-empty:first-child::before]:float-right",
                    "[&_.is-editor-empty:first-child::before]:pointer-events-none",
                    "[&_.is-editor-empty:first-child::before]:h-0",
                    "[&_.is-editor-empty:first-child::before]:text-[#a7abad]",
                    "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                    "[&_h1]:mb-4",
                    "[&_h1]:mt-7",
                    "[&_h1]:text-2xl",
                    "[&_h1]:font-medium",
                    "[&_h2]:mb-3",
                    "[&_h2]:mt-6",
                    "[&_h2]:text-xl",
                    "[&_h2]:font-medium",
                    "[&_h3]:mb-3",
                    "[&_h3]:mt-5",
                    "[&_h3]:text-lg",
                    "[&_h3]:font-medium",
                    "[&_h4]:mb-2",
                    "[&_h4]:mt-4",
                    "[&_h4]:text-base",
                    "[&_h4]:font-medium",
                    "[&_p]:my-3",
                    "[&_ul]:my-4",
                    "[&_ul]:list-disc",
                    "[&_ul]:pr-7",
                    "[&_ol]:my-4",
                    "[&_ol]:list-decimal",
                    "[&_ol]:pr-7",
                    "[&_li]:my-1",
                    "[&_blockquote]:my-5",
                    "[&_blockquote]:border-r-4",
                    "[&_blockquote]:border-[#1b3a6b]",
                    "[&_blockquote]:bg-[#f7f9fc]",
                    "[&_blockquote]:py-2",
                    "[&_blockquote]:pr-4",
                    "[&_blockquote]:text-[#667079]",
                    "[&_pre]:my-5",
                    "[&_pre]:overflow-x-auto",
                    "[&_pre]:rounded-lg",
                    "[&_pre]:bg-[#17202a]",
                    "[&_pre]:p-4",
                    "[&_pre]:text-left",
                    "[&_pre]:text-white",
                    "[&_code]:rounded",
                    "[&_code]:bg-neutral-100",
                    "[&_code]:px-1",
                    "[&_code]:py-0.5",
                    "[&_pre_code]:bg-transparent",
                    "[&_pre_code]:p-0",
                    "[&_hr]:my-7",
                    "[&_hr]:border-neutral-200",
                    "[&_a]:text-[#1b3a6b]",
                    "[&_a]:underline",
                    "[&_a]:underline-offset-4",
                    "[&_img]:mx-auto",
                    "[&_img]:my-6",
                    "[&_img]:block",
                    "[&_img]:h-auto",
                    "[&_img]:max-h-[480px]",
                    "[&_img]:max-w-full",
                    "[&_img]:rounded-xl",
                    "[&_img]:object-contain",
                ].join(" "),
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            onChange?.(currentEditor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;

        editor.setEditable(!disabled);
    }, [editor, disabled]);

    useEffect(() => {
        if (!editor) return;

        const currentValue = editor.getHTML();
        const nextValue = value || "";

        if (nextValue !== currentValue) {
            editor.commands.setContent(nextValue, false);
        }
    }, [editor, value]);

    const openLinkModal = () => {
        if (!editor || disabled) return;

        setLinkValue(getCurrentLink(editor));
        setLinkModalOpen(true);
    };

    const applyLink = () => {
        if (!editor) return;

        const href = normalizeHref(linkValue);

        if (!href) {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }

        setLinkModalOpen(false);
        setLinkValue("");
    };

    const applyImageUrl = () => {
        if (!editor) return;

        const url = imageUrlValue.trim();

        if (!url) {
            setImageUrlModalOpen(false);
            setImageUrlValue("");
            return;
        }

        editor
            .chain()
            .focus()
            .setImage({
                src: url,
                alt: "تصویر توضیحات محصول",
            })
            .run();

        setImageUrlModalOpen(false);
        setImageUrlValue("");
    };

    const uploadEditorImage = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file || !editor || !uploadImage || disabled) return;

        try {
            if (validateBeforeUpload) {
                const isValid = await validateBeforeUpload(file);

                if (!isValid) return;
            }

            setImageUploading(true);

            const result = await uploadImage(file);

            if (!result?.url) {
                throw new Error("آدرس تصویر از سرور دریافت نشد");
            }

            editor
                .chain()
                .focus()
                .setImage({
                    src: result.url,
                    alt: file.name || "تصویر توضیحات محصول",
                })
                .run();

            message.success("تصویر با موفقیت به توضیحات اضافه شد");
        } catch (error) {
            console.error("Rich text image upload failed:", error);
            message.error("آپلود تصویر داخل توضیحات ناموفق بود");
        } finally {
            setImageUploading(false);
        }
    };

    if (!editor) {
        return (
            <div
                className="rounded-xl border border-neutral-200 bg-white"
                style={{ minHeight }}
            />
        );
    }

    return (
        <>
            <div
                className={[
                    "overflow-hidden rounded-xl border border-neutral-300 bg-white",
                    disabled ? "opacity-70" : "",
                ].join(" ")}
            >
                <div
                    dir="rtl"
                    className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 p-2"
                >
                    <ToolbarButton
                        title="عنوان بزرگ"
                        active={editor.isActive("heading", { level: 1 })}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 1 }).run()
                        }
                    >
                        <span className="text-xs font-bold">H1</span>
                    </ToolbarButton>

                    <ToolbarButton
                        title="عنوان متوسط"
                        active={editor.isActive("heading", { level: 2 })}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 2 }).run()
                        }
                    >
                        <span className="text-xs font-bold">H2</span>
                    </ToolbarButton>

                    <ToolbarButton
                        title="عنوان کوچک"
                        active={editor.isActive("heading", { level: 3 })}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 3 }).run()
                        }
                    >
                        <span className="text-xs font-bold">H3</span>
                    </ToolbarButton>

                    <Divider type="vertical" className="!mx-1 !h-5" />

                    <ToolbarButton
                        title="پررنگ"
                        active={editor.isActive("bold")}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <BoldOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="کج"
                        active={editor.isActive("italic")}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <ItalicOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="زیرخط"
                        active={editor.isActive("underline")}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <UnderlineOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="خط‌خورده"
                        active={editor.isActive("strike")}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <StrikethroughOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="پاک‌کردن قالب‌بندی"
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().clearNodes().unsetAllMarks().run()
                        }
                    >
                        <ClearOutlined />
                    </ToolbarButton>

                    <Divider type="vertical" className="!mx-1 !h-5" />

                    <ToolbarButton
                        title="لیست نقطه‌ای"
                        active={editor.isActive("bulletList")}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                    >
                        <UnorderedListOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="لیست شماره‌دار"
                        active={editor.isActive("orderedList")}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                    >
                        <OrderedListOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="نقل‌قول"
                        active={editor.isActive("blockquote")}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                    >
                        <span className="text-lg leading-none">❝</span>
                    </ToolbarButton>

                    <ToolbarButton
                        title="بلوک کد"
                        active={editor.isActive("codeBlock")}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    >
                        <CodeOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="خط جداکننده"
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().setHorizontalRule().run()
                        }
                    >
                        <MinusOutlined />
                    </ToolbarButton>

                    <Divider type="vertical" className="!mx-1 !h-5" />

                    <ToolbarButton
                        title="راست‌چین"
                        active={editor.isActive({ textAlign: "right" })}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().setTextAlign("right").run()
                        }
                    >
                        <AlignRightOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="وسط‌چین"
                        active={editor.isActive({ textAlign: "center" })}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().setTextAlign("center").run()
                        }
                    >
                        <AlignCenterOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="چپ‌چین"
                        active={editor.isActive({ textAlign: "left" })}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().setTextAlign("left").run()
                        }
                    >
                        <AlignLeftOutlined />
                    </ToolbarButton>

                    <Divider type="vertical" className="!mx-1 !h-5" />

                    <Select
                        size="small"
                        disabled={disabled}
                        value={
                            editor.isActive("heading", { level: 1 })
                                ? "h1"
                                : editor.isActive("heading", { level: 2 })
                                    ? "h2"
                                    : editor.isActive("heading", { level: 3 })
                                        ? "h3"
                                        : "paragraph"
                        }
                        onChange={(selectedValue) => {
                            if (selectedValue === "paragraph") {
                                editor.chain().focus().setParagraph().run();
                            }

                            if (selectedValue === "h1") {
                                editor.chain().focus().setHeading({ level: 1 }).run();
                            }

                            if (selectedValue === "h2") {
                                editor.chain().focus().setHeading({ level: 2 }).run();
                            }

                            if (selectedValue === "h3") {
                                editor.chain().focus().setHeading({ level: 3 }).run();
                            }
                        }}
                        options={[
                            { value: "paragraph", label: "پاراگراف" },
                            { value: "h1", label: "عنوان ۱" },
                            { value: "h2", label: "عنوان ۲" },
                            { value: "h3", label: "عنوان ۳" },
                        ]}
                        className="w-28"
                    />

                    <ToolbarButton
                        title="رنگ متن"
                        disabled={disabled}
                        onClick={() => {
                            const color = window.prompt(
                                "رنگ را به صورت HEX وارد کنید؛ مثال: #1b3a6b",
                                "#1b3a6b",
                            );

                            if (!color?.trim()) return;

                            editor.chain().focus().setColor(color.trim()).run();
                        }}
                    >
                        <FontColorsOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="افزودن لینک"
                        active={editor.isActive("link")}
                        disabled={disabled}
                        onClick={openLinkModal}
                    >
                        <LinkOutlined />
                    </ToolbarButton>

                    <ToolbarButton
                        title="افزودن تصویر از URL"
                        disabled={disabled}
                        onClick={() => setImageUrlModalOpen(true)}
                    >
                        <PictureOutlined />
                    </ToolbarButton>

                    <Tooltip title="آپلود تصویر داخل متن">
                        <label
                            className={[
                                "ant-btn ant-btn-text ant-btn-sm flex cursor-pointer items-center justify-center",
                                disabled || imageUploading || !uploadImage
                                    ? "pointer-events-none opacity-50"
                                    : "",
                            ].join(" ")}
                        >
                            <PictureOutlined />
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                disabled={disabled || imageUploading || !uploadImage}
                                onChange={uploadEditorImage}
                            />
                        </label>
                    </Tooltip>

                    <div className="mr-auto flex items-center gap-1">
                        <ToolbarButton
                            title="واگردانی"
                            disabled={disabled || !editor.can().undo()}
                            onClick={() => editor.chain().focus().undo().run()}
                        >
                            <UndoOutlined />
                        </ToolbarButton>

                        <ToolbarButton
                            title="بازگردانی"
                            disabled={disabled || !editor.can().redo()}
                            onClick={() => editor.chain().focus().redo().run()}
                        >
                            <RedoOutlined />
                        </ToolbarButton>

                        <ToolbarButton
                            title="حذف انتخاب فعلی / تصویر انتخاب‌شده"
                            disabled={disabled || editor.state.selection.empty}
                            onClick={() =>
                                editor.chain().focus().deleteSelection().run()
                            }
                        >
                            <DeleteOutlined />
                        </ToolbarButton>
                    </div>
                </div>

                <div
                    style={{ minHeight }}
                    className="cursor-text"
                    onClick={() => {
                        if (!disabled) editor.commands.focus();
                    }}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>

            <Modal
                open={linkModalOpen}
                title="افزودن لینک"
                okText="ثبت لینک"
                cancelText="انصراف"
                onOk={applyLink}
                onCancel={() => {
                    setLinkModalOpen(false);
                    setLinkValue("");
                }}
                destroyOnClose
            >
                <Input
                    autoFocus
                    value={linkValue}
                    placeholder="https://example.com"
                    onChange={(event) => setLinkValue(event.target.value)}
                    onPressEnter={applyLink}
                    dir="ltr"
                />
            </Modal>

            <Modal
                open={imageUrlModalOpen}
                title="افزودن تصویر از URL"
                okText="افزودن تصویر"
                cancelText="انصراف"
                onOk={applyImageUrl}
                onCancel={() => {
                    setImageUrlModalOpen(false);
                    setImageUrlValue("");
                }}
                destroyOnClose
            >
                <Input
                    autoFocus
                    value={imageUrlValue}
                    placeholder="https://example.com/image.webp"
                    onChange={(event) => setImageUrlValue(event.target.value)}
                    onPressEnter={applyImageUrl}
                    dir="ltr"
                />
            </Modal>
        </>
    );
}
