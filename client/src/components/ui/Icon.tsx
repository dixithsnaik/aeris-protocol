type Props = {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
};

export function Icon({ src, alt = "", size = 20, className = "" }: Props) {
  return <img src={src} alt={alt} width={size} height={size} className={className} />;
}
