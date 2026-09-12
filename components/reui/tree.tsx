"use client";

import type { ItemInstance } from "@headless-tree/core";
import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Slot } from "radix-ui";
import type {
	ButtonHTMLAttributes,
	CSSProperties,
	HTMLAttributes,
} from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

type ToggleIconType = "chevron" | "plus-minus";

/** Minimal surface used from headless-tree without pulling full generics as `any`. */
type HeadlessTreeLike = {
	getContainerProps?: () => HTMLAttributes<HTMLElement>;
	getDragLineStyle?: () => CSSProperties;
};

interface TreeContextValue<T = unknown> {
	indent: number;
	currentItem?: ItemInstance<T>;
	tree?: HeadlessTreeLike;
	toggleIconType?: ToggleIconType;
}

const TreeContext = createContext<TreeContextValue>({
	indent: 20,
	currentItem: undefined,
	tree: undefined,
	toggleIconType: "plus-minus",
});

function useTreeContext<T = unknown>() {
	return useContext(TreeContext) as TreeContextValue<T>;
}

interface TreeProps extends HTMLAttributes<HTMLDivElement> {
	indent?: number;
	tree?: HeadlessTreeLike;
	toggleIconType?: ToggleIconType;
	asChild?: boolean;
}

function Tree({
	indent = 20,
	tree,
	className,
	toggleIconType = "chevron",
	asChild = false,
	...props
}: TreeProps) {
	const containerProps =
		tree && typeof tree.getContainerProps === "function"
			? tree.getContainerProps()
			: {};
	const mergedProps = { ...props, ...containerProps };

	// Extract style from mergedProps to merge with our custom styles
	const { style: propStyle, ...otherProps } = mergedProps;

	// Merge styles
	const mergedStyle = {
		...propStyle,
		"--tree-indent": `${indent}px`,
	} as CSSProperties;

	const Comp = asChild ? Slot.Root : "div";

	return (
		<TreeContext.Provider value={{ indent, tree, toggleIconType }}>
			<Comp
				className={cn("flex flex-col", className)}
				data-slot="tree"
				style={mergedStyle}
				{...otherProps}
			/>
		</TreeContext.Provider>
	);
}

interface TreeItemProps<T = unknown>
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "indent"> {
	item: ItemInstance<T>;
	indent?: number;
	asChild?: boolean;
}

function TreeItem<T = unknown>({
	item,
	className,
	asChild = false,
	children,
	onClick,
	onMouseDown,
	style,
	...props
}: TreeItemProps<T>) {
	const parentContext = useTreeContext<T>();
	const { indent } = parentContext;

	const itemProps =
		typeof item.getProps === "function"
			? item.getProps()
			: ({} as Record<string, unknown>);
	const {
		onClick: itemOnClick,
		onMouseDown: itemOnMouseDown,
		style: itemStyle,
		className: itemClassName,
		...restItemProps
	} = itemProps as ButtonHTMLAttributes<HTMLButtonElement>;

	// Merge styles
	const mergedStyle = {
		...itemStyle,
		...style,
		"--tree-padding": `${item.getItemMeta().level * indent}px`,
	} as CSSProperties;

	const Comp = asChild ? Slot.Root : "button";

	return (
		<TreeContext.Provider
			value={{ ...parentContext, currentItem: item } as TreeContextValue}
		>
			<Comp
				{...restItemProps}
				{...props}
				aria-expanded={item.isExpanded()}
				className={cn(
					"z-10 select-none ps-(--tree-padding) not-last:pb-0.5 outline-hidden focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
					itemClassName,
					className,
				)}
				data-drag-target={
					typeof item.isDragTarget === "function"
						? item.isDragTarget() || false
						: undefined
				}
				data-focus={
					typeof item.isFocused === "function"
						? item.isFocused() || false
						: undefined
				}
				data-folder={
					typeof item.isFolder === "function"
						? item.isFolder() || false
						: undefined
				}
				data-search-match={
					typeof item.isMatchingSearch === "function"
						? item.isMatchingSearch() || false
						: undefined
				}
				data-selected={
					typeof item.isSelected === "function"
						? item.isSelected() || false
						: undefined
				}
				data-slot="tree-item"
				onClick={(event) => {
					itemOnClick?.(event);
					onClick?.(event);
				}}
				onMouseDown={(event) => {
					itemOnMouseDown?.(event);
					onMouseDown?.(event);
				}}
				style={mergedStyle}
			>
				{children}
			</Comp>
		</TreeContext.Provider>
	);
}

interface TreeItemLabelProps<T = unknown>
	extends HTMLAttributes<HTMLSpanElement> {
	item?: ItemInstance<T>;
	asChild?: boolean;
}

function TreeItemLabel<T = unknown>({
	item: propItem,
	children,
	className,
	asChild = false,
	...props
}: TreeItemLabelProps<T>) {
	const { currentItem, toggleIconType } = useTreeContext<T>();
	const item = propItem || currentItem;

	if (!item) {
		console.warn("TreeItemLabel: No item provided via props or context");
		return null;
	}

	const Comp = asChild ? Slot.Root : "span";

	return (
		<Comp
			className={cn(
				"flex items-center gap-1 bg-background in-data-[drag-target=true]:bg-accent in-data-[search-match=true]:bg-blue-50! in-data-[selected=true]:bg-accent not-in-data-[folder=true]:ps-7 in-data-[selected=true]:text-accent-foreground in-focus-visible:ring-[3px] in-focus-visible:ring-ring/50 transition-colors hover:bg-accent [&_svg]:pointer-events-none [&_svg]:shrink-0",
				"rounded-md",
				"py-1.5",
				"px-2",
				"text-sm",
				className,
			)}
			data-slot="tree-item-label"
			{...props}
		>
			{item.isFolder() &&
				(toggleIconType === "plus-minus" ? (
					item.isExpanded() ? (
						<MinusIcon
							className="size-3.5 text-muted-foreground"
							stroke="currentColor"
							strokeWidth="1"
						/>
					) : (
						<PlusIcon
							className="size-3.5 text-muted-foreground"
							stroke="currentColor"
							strokeWidth="1"
						/>
					)
				) : (
					<ChevronDownIcon className="size-4 in-aria-[expanded=false]:-rotate-90 text-muted-foreground" />
				))}
			{children ||
				(typeof item.getItemName === "function" ? item.getItemName() : null)}
		</Comp>
	);
}

function TreeDragLine({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	const { tree } = useTreeContext();

	if (!tree || typeof tree.getDragLineStyle !== "function") {
		console.warn(
			"TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method",
		);
		return null;
	}

	const dragLine = tree.getDragLineStyle();
	return (
		<div
			className={cn(
				"absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:border-2 before:border-primary before:bg-background",
				"before:rounded-full",
				className,
			)}
			style={dragLine}
			{...props}
		/>
	);
}

export { Tree, TreeDragLine, TreeItem, TreeItemLabel };
