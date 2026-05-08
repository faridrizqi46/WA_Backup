'use client';

import { AccountDetail } from '@/types';

interface AccountInformationProps {
  account: AccountDetail;
}

export default function AccountInformation({ account }: AccountInformationProps) {
  const mapSrc = `https://maps.google.com/maps?q=${account.latitude},${account.longitude}&z=14&output=embed`;

  return (
    <div className="bg-white rounded-sm p-6">
      <div className="flex gap-8">
        {/* Left: about text */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{account.description}</p>
        </div>

        {/* Right: map + address */}
        <div className="w-72 flex-shrink-0 space-y-3">
          <div className="w-full h-44 rounded overflow-hidden border border-gray-200">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Company location map"
            />
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-semibold text-gray-800">Head Quarter</p>
            <p>{account.headquarters}</p>
            <p className="text-gray-500 mt-1">
              Also found at: {account.alsoFoundAt.join(', and ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
