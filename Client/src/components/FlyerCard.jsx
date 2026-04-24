export default function FlyerCard({ flyer }) {
  return (
    <div className="bg-white shadow rounded-xl p-3">
      <h3 className="font-semibold">{flyer.title}</h3>

      <a
        href={flyer.pdf}
        target="_blank"
        className="text-blue-500 text-sm"
      >
        View PDF
      </a>
    </div>
  );
}