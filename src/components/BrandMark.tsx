import mark from '../assets/brand/mark.svg';

export function BrandMark({ size = 32 }: { size?: 16 | 24 | 32 | 64 }) {
  return <img className="brand-mark" src={mark} width={size} height={size} alt="" aria-hidden="true" />;
}
