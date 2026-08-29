export default function BrandLogo({ className = "", ...props }) {
  return (
    <img
      src="/logo.jpeg"
      alt="ParkHub"
      width="1176"
      height="416"
      className={className}
      {...props}
    />
  )
}
