"use client";

import { Modal } from "antd";
import { ReactNode } from "react";

type Props = {
    open: boolean;
    title: ReactNode;
    onCancel: () => void;
    children: ReactNode;
    width?: number;
    footer?: ReactNode | null;
};

export default function AdminModal({
    open,
    title,
    onCancel,
    children,
    width = 920,
    footer = null,
}: Props) {
    return (
        <Modal
            open={open}
            title={title}
            onCancel={onCancel}
            footer={footer}
            width={width}
            centered
            destroyOnHidden
        >
            {children}
        </Modal>
    );
}
