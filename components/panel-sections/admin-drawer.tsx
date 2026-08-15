"use client";

import { Drawer } from "antd";
import { ReactNode } from "react";

type Props = {
    open: boolean;
    title: ReactNode;
    onClose: () => void;
    children: ReactNode;
    width?: number | string;
};

export default function AdminDrawer({
    open,
    title,
    onClose,
    children,
    width = 420,
}: Props) {
    return (
        <Drawer
            open={open}
            title={title}
            onClose={onClose}
            width={width}
            placement="right"
            destroyOnHidden
        >
            {children}
        </Drawer>
    );
}
